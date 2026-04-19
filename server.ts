import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import DodoPayments from "dodopayments";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dodo Payments Client (Lazy loaded)
  let dodoClient: DodoPayments | null = null;
  function getDodoClient() {
    if (!dodoClient && process.env.DODO_PAYMENTS_API_KEY) {
      dodoClient = new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      });
    }
    return dodoClient;
  }

  // Email Transporter (Lazy loaded)
  let transporter: nodemailer.Transporter | null = null;

  function getTransporter() {
    if (!transporter) {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }
    }
    return transporter;
  }

  // API Routes
  app.post("/api/payments/create-session", async (req, res) => {
    const { tournamentId, tournamentTitle, fee, customerEmail, customerName } = req.body;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return res.status(400).json({ 
        error: "Invalid email address", 
        message: "유효한 이메일 주소를 입력해주세요." 
      });
    }

    const dodo = getDodoClient();
    if (!dodo) {
      console.warn("[Payments] Dodo Payments API key not set. Returning mock success.");
      return res.json({ 
        success: true, 
        isMock: true,
        checkout_url: `${req.get('origin') || ''}?payment_status=success&tournament_id=${tournamentId}` 
      });
    }

    try {
      // Dodo Payments usually requires a product_id. 
      // If we don't have one per tournament, we use a default one from env or mapping.
      const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || "p_default";

      const session = await dodo.checkoutSessions.create({
        customer: {
          email: customerEmail,
          name: customerName || "Guest Player",
        },
        product_cart: [{
          product_id: productId,
          quantity: 1,
        }],
        return_url: `${req.get('origin') || ''}?payment_status=success&tournament_id=${tournamentId}`,
        metadata: {
          tournamentId: String(tournamentId),
          tournamentTitle
        }
      });

      res.json({ 
        success: true, 
        checkout_url: (session as any).checkout_url || (session as any).payment_url 
      });
    } catch (error) {
      console.error("[Payments] Error creating Dodo session:", error);
      res.status(500).json({ error: "Failed to create payment session", details: error });
    }
  });

  app.post("/api/notify/approve", async (req, res) => {
    const { email, userName, tournamentTitle } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log(`[Email] Preparing to send approval to ${email} for ${tournamentTitle}`);
    console.log(`[Email] SMTP Vars: HOST=${process.env.SMTP_HOST}, USER=${process.env.SMTP_USER}, PORT=${process.env.SMTP_PORT}`);

    const mailOptions = {
      from: `"BSK Arena" <${process.env.FROM_EMAIL || "hello@bskleague.com"}>`,
      to: email,
      subject: `[BSK Arena] 축하합니다! ${tournamentTitle} 참가 승인 안내`,
      text: `${userName}님, 안녕하세요!\n\n신청하신 [${tournamentTitle}] 토너먼트 참가가 승인되었습니다.\n자세한 일정 및 대진표는 사이트에서 확인해 주세요.\n\n감사합니다.\nBSK Arena 팀 드림`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ffce00;">축하합니다!</h2>
          <p><strong>${userName}</strong>님, 안녕하세요!</p>
          <p>신청하신 <strong>[${tournamentTitle}]</strong> 토너먼트 참가가 승인되었습니다.</p>
          <p>자세한 일정 및 대진표는 홈페이지에서 확인해 주세요.</p>
          <br />
          <p>BSK Arena 팀 드림</p>
        </div>
      `,
    };

    const client = getTransporter();

    if (client) {
      try {
        const info = await client.sendMail(mailOptions);
        console.log(`[Email] Sent to ${email} successfully. ID: ${info.messageId}`);
        res.json({ success: true, message: "Email sent", messageId: info.messageId });
      } catch (error: any) {
        console.error("[Email] Error sending email:", error);
        res.status(500).json({ 
          success: false, 
          error: "Failed to send email", 
          details: error.message,
          code: error.code 
        });
      }
    } else {
      console.warn("[Email] SMTP credentials not set. Logging email content instead.");
      res.json({ success: true, message: "Emulated email send (No credentials set)", isMock: true });
    }
  });

  app.post("/api/test-smtp", async (req, res) => {
    const client = getTransporter();
    if (!client) {
      return res.status(400).json({ 
        success: false, 
        error: "SMTP CREDENTIALS NOT CONFIGURED",
        details: "Please ensure SMTP_USER, SMTP_PASS, SMTP_HOST, and FROM_EMAIL are set in the environment variables via the Settings menu."
      });
    }
    try {
      await client.verify();
      res.json({ success: true, message: "SMTP connection verified successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message, code: error.code });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
