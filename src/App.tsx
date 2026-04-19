/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Zap, 
  Crown, 
  Medal, 
  Shield, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  LayoutDashboard,
  Bell,
  MessageSquare,
  Search,
  ChevronRight,
  Clock,
  Flame,
  AlertCircle,
  Monitor,
  Settings,
  Tv,
  Link,
  CheckCircle,
  Video,
  AlertTriangle,
  ExternalLink,
  Clipboard,
  MoreVertical
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

// --- Mock Data ---

const TOURNAMENT_THEMES = [
  { id: 'classic', name: '클래식 블루', color: 'bs-cyan', bg: 'bg-bs-cyan/5' },
  { id: 'lava', name: '용암 볼카노', color: 'bs-red', bg: 'bg-bs-red/5' },
  { id: 'cyber', name: '사이버 네온', color: 'bs-purple', bg: 'bg-bs-purple/5' },
  { id: 'gold', name: '골든 아레나', color: 'bs-yellow', bg: 'bg-bs-yellow/5' },
  { id: 'forest', name: '딥 포레스트', color: 'bs-secondary', bg: 'bg-bs-secondary/5' },
  { id: 'blitz', name: '블리츠 썬더', color: 'bs-cyan', bg: 'bg-black', special: 'blitz' },
  { id: 'void', name: '글리치 보이드', color: 'white', bg: 'bg-white/5', special: 'glitch' },
  { id: 'royal', name: '로열 팰리스', color: 'bs-yellow', bg: 'bg-bs-purple/20', shadow: 'shadow-glow-yellow' },
];

const TOURNAMENT_CATEGORIES = [
  { id: 'starter', name: '입문전', fee: '₩1,000', desc: '초보자 및 신규 참가자 대상', color: 'bs-cyan' },
  { id: 'normal', name: '일반전', fee: '₩3,000', desc: '실력을 쌓아가는 일반 플레이어', color: 'bs-secondary' },
  { id: 'pro', name: '고수전', fee: '초청제', desc: '상위 랭커 및 엄선된 실력자들', color: 'bs-purple' },
  { id: 'blitz', name: '야간 번개컵', fee: '₩2,000', desc: '오늘 신청해서 오늘 끝내는 스피드 컵', color: 'bs-yellow' },
  { id: 'exam', name: '시험 종료컵', fee: '₩1,000', desc: '시험 끝! 스트레스 해소 시즌 이벤트', color: 'bs-red' },
];

const TOURNAMENT_MODES = [
  { id: 'brawl_ball', name: '브롤 볼' },
  { id: 'gem_grab', name: '젬 그랩' },
  { id: 'knockout', name: '녹아웃' },
  { id: 'bounty', name: '바운티' },
  { id: 'hot_zone', name: '핫 존' },
];

const MATCH_STATUS_MAP: Record<string, { label: string, color: string }> = {
  waiting: { label: '대기 중', color: 'text-white/20' },
  friend_request_pending: { label: '친구 추가 대기', color: 'text-bs-yellow' },
  ready_for_observation: { label: '관전 준비 완료', color: 'text-bs-cyan' },
  live: { label: '라이브 진행 중', color: 'text-bs-red' },
  verified: { label: '결과 확인됨', color: 'text-bs-purple' },
  disputed: { label: '분쟁 발생', color: 'text-bs-red animate-pulse' },
  completed: { label: '종료', color: 'text-white/40' },
};

const OBSERVATION_STATUS_MAP: Record<string, string> = {
  pending: '대기',
  requested: '요청됨',
  observing: '관전 중',
  verified: '확인 완료',
};

const STREAM_STATUS_MAP: Record<string, string> = {
  none: '없음',
  scheduled: '예정됨',
  live: '생중계 중',
  ended: '종료됨',
};

const OPERATOR_INFO = {
  tag: 'G9LPQPU0V',
  name: 'luckydeduking',
  link: 'https://link.brawlstars.com/invite/friend/kr?tag=G9LPQPU0V&token=zwt8fb49'
};

const OperatorGuide = () => (
  <div className="p-8 bg-bs-yellow/5 border-2 border-bs-yellow/30 space-y-6">
      <div className="flex items-center gap-4">
          <Users className="text-bs-yellow" size={32} />
          <h3 className="font-display font-black text-2xl uppercase italic tracking-tighter">운영자 연동 안내</h3>
      </div>
      <p className="text-sm font-bold text-white/60 leading-relaxed uppercase">
          원활한 경기 진행과 공식 결과 합산을 위해 아래 계정을 반드시 친구 추가해 주세요.
      </p>
      <div className="p-6 bg-black/40 border-2 border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-bs-yellow text-black rotate-3 font-display font-black">ID</div>
              <div>
                 <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">운영자 계정</div>
                 <div className="text-xl font-display font-black text-bs-yellow uppercase">{OPERATOR_INFO.name}</div>
                 <div className="text-xs font-mono text-white/60">TAG: {OPERATOR_INFO.tag}</div>
              </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(OPERATOR_INFO.tag);
                 alert("태그가 복사되었습니다!");
               }}
               className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
             >
               <Clipboard size={14} /> 태그 복사
             </button>
             <a 
               href={OPERATOR_INFO.link}
               target="_blank"
               rel="noreferrer"
               className="flex-1 md:flex-none px-6 py-3 bg-bs-yellow text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
             >
               <ExternalLink size={14} /> 친구 추가
             </a>
          </div>
      </div>
  </div>
);

const LIVE_TOURNAMENTS = [];
const TOP_RANKERS = [];

// --- Components ---

const AlertOverlay = ({ alerts, onRemove }: { alerts: any[], onRemove: (id: number) => void }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-[200] pointer-events-none p-6 space-y-4">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`max-w-xl mx-auto p-6 border-l-8 shadow-2xl backdrop-blur-md pointer-events-auto flex items-center gap-6 ${
              alert.type === 'urgent' ? 'bg-bs-red/90 border-white text-white' : 'bg-bs-yellow/90 border-black text-black'
            }`}
          >
            <div className={`shrink-0 ${alert.type === 'urgent' ? 'text-white' : 'text-black'}`}>
               {alert.type === 'urgent' ? <Shield size={32} /> : <Zap size={32} />}
            </div>
            <div className="flex-1">
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${alert.type === 'urgent' ? 'text-white/60' : 'text-black/60'}`}>
                {alert.type === 'urgent' ? '긴급 시스템 공지' : '대회 시작 알림'}
              </div>
              <div className="font-display font-black text-xl uppercase italic tracking-tighter">
                {alert.content}
              </div>
            </div>
            <button onClick={() => onRemove(alert.id)} className={`p-2 transition-transform hover:scale-110 ${alert.type === 'urgent' ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
               <Shield size={20} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 border-white/5 bg-bs-bg/80 backdrop-blur-md px-10 py-6">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-display font-black text-2xl tracking-tighter uppercase text-bs-yellow italic">BSK LEAGUE</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 font-display font-bold text-xs tracking-widest uppercase">
        <a href="#tournaments" className="hover:text-bs-yellow transition-colors">대회 목록</a>
        <a href="#hall-of-fame" className="hover:text-bs-yellow transition-colors">랭킹 현황</a>
        <a href="#hall-of-fame" className="hover:text-bs-yellow transition-colors">명예의 전당</a>
        <a href="#items" className="hover:text-bs-yellow transition-colors">아이템 상점</a>
      </div>
    </div>
  </nav>
);

const Hero = ({ onRegister, liveSettings, matches }: { onRegister: () => void, liveSettings: any, matches?: any[] }) => {
  const activeLiveMatch = matches?.find(m => m.streamStatus === 'live');
  return (
  <section className="relative pt-32 pb-0 px-10 overflow-hidden min-h-screen flex flex-col justify-center">
    {/* Animated Background Text (Electronic Marquee Style) */}
    <div className="absolute top-[45%] left-0 w-full h-[600px] pointer-events-none select-none -translate-y-1/2 rotate-[10deg] overflow-hidden whitespace-nowrap z-0 flex items-center">
      <div className="flex animate-marquee-slower opacity-[0.04] font-display font-black text-[400px] leading-none">
        {/* Creating a long string for the scrolling effect */}
        {Array(10).fill('BSK LEAGUE ARENA • ').map((text, i) => (
          <span key={i} className="pr-20 uppercase italic">{text}</span>
        ))}
      </div>
    </div>

    <div className="max-w-7xl mx-auto w-full relative z-10">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="text-xl md:text-2xl font-light text-bs-yellow tracking-[0.2em] uppercase">
            전국 챔피언십 시즌 12
          </span>
          {liveSettings.isLive || activeLiveMatch ? (
            <div className="flex items-center gap-2 bg-bs-red/20 px-4 py-1 border border-bs-red/40 animate-pulse">
              <span className="w-2 h-2 bg-bs-red rounded-full" />
              <span className="text-bs-red text-[10px] font-black uppercase tracking-widest leading-none">
                경기진행중! 탭하여 관전하세요 ㅎ
              </span>
            </div>
          ) : null}
        </div>

        {(liveSettings.isLive || activeLiveMatch) && (
          <div className="mb-10 p-6 bg-white/[0.03] border-l-4 border-bs-red inline-flex items-center gap-8 font-display font-black text-2xl md:text-4xl uppercase italic tracking-tighter">
            <span className="text-white/20 not-italic text-sm font-bold tracking-[0.3em]">VS BATTLE</span>
            <span className="text-bs-cyan">{activeLiveMatch ? activeLiveMatch.teamAName : liveSettings.teamA}</span>
            <span className="text-bs-red text-5xl not-italic">VS</span>
            <span className="text-bs-cyan">{activeLiveMatch ? activeLiveMatch.teamBName : liveSettings.teamB}</span>
          </div>
        )}

        <h1 className="font-display font-black text-7xl md:text-8xl lg:text-[140px] leading-[0.85] tracking-[-0.04em] uppercase mb-10">
          BRAWL CUP<br />
          <span className="text-outline">LEGENDS</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <button 
            onClick={onRegister}
            className="px-12 py-6 bg-bs-red text-white rounded-none font-display font-black text-2xl uppercase tracking-wider shadow-block transform transition-transform hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0"
          >
            참가신청 하기
          </button>
          
          {(liveSettings.showLiveButton || (activeLiveMatch && activeLiveMatch.streamStatus === 'live')) ? (
            <a 
              href={activeLiveMatch?.streamUrl || liveSettings.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-5 bg-bs-cyan text-black rounded-none border-2 border-bs-cyan font-display font-black text-lg uppercase tracking-wider shadow-block-cyan hover:-translate-x-1 hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              <Tv size={24} /> {activeLiveMatch ? '진행중인 라이브 보기' : '관전 페이지 이동'}
            </a>
          ) : (
            <button 
              className="px-8 py-5 border-2 border-white rounded-none font-display font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transition-all"
            >
              대진표 확인
            </button>
          )}
        </div>
      </motion.div>
    </div>

    {/* Hall of Fame Preview moved inside to be properly layered */}
    <div className="hidden xl:block absolute top-32 right-10 w-64 bg-white/5 border-l-4 border-bs-yellow p-6 z-20 backdrop-blur-sm">
      <div className="text-[10px] font-black text-bs-yellow mb-3 tracking-widest uppercase">명예의 전당</div>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-bold uppercase">KR_GOSU_99</div>
          <div className="text-[10px] text-white/60 font-medium">시즌 11 그랜드 챔피언</div>
        </div>
        <div className="h-px bg-white/10" />
        <div>
          <div className="text-sm font-bold uppercase">TEAM PEAK</div>
          <div className="text-[10px] text-white/60 font-medium">최다 승리: 42 매치</div>
        </div>
      </div>
    </div>
  </section>
  );
};

const StatsShelf = () => (
  <div className="max-w-7xl mx-auto px-10 grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-white/10 bg-gradient-to-t from-bs-yellow/5 to-transparent">
    {[
      { label: '총 상금 규모', value: '₩5,000,000', suffix: '+' },
      { label: '현재 참가 팀', value: '184 / 256', suffix: '' },
      { label: '대회 진행 방식', value: '3v3 Single', suffix: '' },
      { label: '등록 마감까지', value: '04D 12H 31M', suffix: '' },
    ].map((stat, i) => (
      <div key={i} className="p-10 border-r border-white/10 last:border-r-0">
        <span className="block text-[11px] uppercase text-white/60 mb-2 tracking-widest font-bold font-sans">{stat.label}</span>
        <div className="font-display font-black text-3xl uppercase tracking-tight">
          {stat.value}<span className="text-bs-red">{stat.suffix}</span>
        </div>
      </div>
    ))}
  </div>
);

const LiveMarquee = ({ tournaments }: { tournaments: any[] }) => (
  <div className="py-6 border-y border-white/5 bg-white/[0.02] overflow-hidden whitespace-nowrap">
    <div className="flex animate-marquee">
      {[...tournaments, ...tournaments].map((t, i) => (
        <div key={i} className="flex items-center gap-8 px-12 border-r border-white/10">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${t.status === 'live' || t.status === 'LIVE' ? 'bg-bs-red animate-pulse' : 'bg-bs-yellow'}`} />
            <span className="font-display font-bold text-sm tracking-widest uppercase">{t.status === 'live' || t.status === 'LIVE' ? '생중계' : '대기중'}</span>
          </span>
          <span className="font-display font-black text-xl uppercase italic">{t.title}</span>
          <span className="font-mono text-bs-purple font-bold tracking-tighter">{t.prize}</span>
          <div className="flex items-center gap-2 text-white/40 uppercase font-black text-[10px] tracking-widest">
            <Users size={12} />
            {t.players} 참여자
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SectionHeading = ({ title, subtitle, badge }: { title: string, subtitle: string, badge?: string }) => (
  <div className="mb-16">
    {badge && (
      <span className="inline-block px-3 py-1 bg-bs-yellow text-black text-[10px] font-black tracking-widest uppercase rounded-none mb-4">
        {badge}
      </span>
    )}
    <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter mb-4 leading-none">{title}</h2>
    <p className="text-white/60 font-medium text-lg max-w-2xl">{subtitle}</p>
  </div>
);

const TournamentCard: React.FC<{ 
  tournament: any, 
  onRegister: (id: number) => void,
  onDetail: (id: number) => void
}> = ({ 
  tournament, 
  onRegister,
  onDetail
}) => {
  const theme = TOURNAMENT_THEMES.find(t => t.id === tournament.theme) || TOURNAMENT_THEMES[0];
  const isBlitz = theme.special === 'blitz';
  
  return (
    <div 
      className={`group relative border-2 rounded-none p-8 transition-all duration-300 ease-out hover:scale-[1.02] overflow-hidden ${isBlitz ? 'animate-border-flash border-bs-cyan' : `border-white/10 hover:border-${theme.color}`} ${theme.bg} ${theme.shadow || ''}`}
      style={{ '--shadow-color': `var(--tw-gradient-from, ${theme.color === 'bs-yellow' ? '#ffce00' : theme.color === 'bs-red' ? '#ff3e3e' : '#00e5ff'})` } as any}
    >
      {isBlitz && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-bs-cyan/20 via-transparent to-bs-yellow/20 animate-lightning" />
          <Zap className="absolute top-2 right-2 text-bs-cyan/30 animate-pulse" size={120} />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className={`p-4 bg-${theme.color} text-black rounded-none transition-transform duration-300 group-hover:rotate-12 ${isBlitz ? 'animate-pulse' : ''}`}>
            <Trophy size={24} />
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">총 상금</div>
            <div className={`font-display font-black text-3xl text-${theme.color} italic tracking-tighter leading-none`}>{tournament.prize}</div>
          </div>
        </div>

        <h3 className={`font-display font-black text-3xl uppercase mb-4 group-hover:text-${theme.color} transition-colors leading-none tracking-tight`}>{tournament.title}</h3>
        
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              <Users size={16} className={`text-${theme.color}`} />
              {tournament.players + (tournament.registrations?.length || 0)} 참여중
            </div>
            <div className="px-2 py-1 bg-white/5 border border-white/10 text-[10px] font-black text-bs-yellow italic uppercase">
              참가비 {tournament.fee}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              <Clock size={16} />
              {new Date(tournament.startTime).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 시작
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              <Search size={16} />
              MAP: {tournament.mapName} • MODE: {TOURNAMENT_MODES.find(m => m.id === tournament.mode)?.name || '기본'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onRegister(tournament.id)}
            className={`w-full py-4 bg-${theme.color} ${theme.color === 'bs-yellow' || theme.color === 'white' ? 'text-black' : 'text-white'} rounded-none font-display font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 shadow-block`}
          >
            참가 신청
          </button>
          <button 
            onClick={() => onDetail(tournament.id)}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-none font-display font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
          >
            자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
};

const BracketMockup = () => (
  <div className="relative bg-white/[0.02] border-2 border-white/5 rounded-none p-12 lg:p-20 overflow-hidden">
    <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
      <div className="flex-1">
        <SectionHeading 
          badge="경기 관리 시스템"
          title="자동화 대진표 기능"
          subtitle="우리의 독창적인 매칭 엔진은 딜레이 없는 실시간 대진표 업데이트를 보장합니다."
        />
        
        <div className="grid grid-cols-1 gap-8 max-w-sm">
          {[
            { t1: 'T-REX', t2: 'HYPER', score: '2 - 0', active: true },
            { t1: 'BRAWLERS', t2: 'KINGS', score: '1 - 2', active: false },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-none border-2 ${item.active ? 'border-bs-yellow bg-bs-yellow/5 shadow-[10px_10px_0px_rgba(255,206,0,1)]' : 'border-white/10 bg-white/[0.01]'}`}
            >
              <div className="flex items-center justify-between font-display font-black text-[10px] uppercase tracking-[0.3em] mb-4 opacity-60">
                <span>스테이지 01</span>
                <span className={item.active ? 'text-bs-yellow' : ''}>{item.active ? '● 경기 진행중' : '종료됨'}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-xl uppercase tracking-tighter">{item.t1}</span>
                  <span className="font-display font-black text-2xl text-bs-cyan italic">{item.score.split('-')[0]}</span>
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-xl uppercase tracking-tighter opacity-30">{item.t2}</span>
                  <span className="font-display font-black text-2xl text-white/20 italic">{item.score.split('-')[1]}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex justify-center relative">
        <div className="w-96 h-96 bg-bs-yellow/10 blur-[150px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[400px] h-[400px] border-4 border-white/5 flex items-center justify-center relative">
          <div className="p-8 bg-bs-yellow text-black absolute -top-8 -left-8 font-display font-black text-3xl uppercase tracking-tighter rotate-[-4deg]">박진감 넘치는 아레나</div>
          <Trophy className="text-bs-yellow opacity-20" size={200} />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="w-full h-full border-2 border-bs-yellow flex items-center justify-center font-display font-black text-6xl text-center uppercase leading-none italic tracking-tighter">
              전투<br/>스테이션
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RegistrationView = ({ tournament, onCancel, onSubmit }: { tournament: any, onCancel: () => void, onSubmit: (data: any) => void }) => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    teamName: '',
    leaderId: '',
    email: '',
    phone: '',
    sns: '',
    snsType: 'instagram'
  });

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[120] bg-bs-bg flex items-center justify-center p-6"
      >
        <div className="max-w-xl w-full text-center space-y-8 p-16 border-4 border-bs-yellow bg-white/[0.02]">
          <div className="w-24 h-24 bg-bs-yellow text-black flex items-center justify-center mx-auto rotate-12">
            <Trophy size={48} />
          </div>
          <h2 className="font-display font-black text-5xl uppercase italic tracking-tighter">신청 완료!</h2>
          <p className="text-white/60 font-medium text-lg leading-relaxed uppercase tracking-tight">
            성공적으로 접수되었습니다.<br />
            관리자가 검토 후 등록하신 이메일로 안내해 드립니다.
          </p>
          <button 
            onClick={onCancel}
            className="w-full py-6 bg-bs-yellow text-black font-display font-black text-xl uppercase tracking-widest shadow-block hover:scale-[1.02] transition-all"
          >
            메인으로 돌아가기
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[120] bg-bs-bg overflow-y-auto p-6 md:p-20"
    >
      <div className="max-w-4xl mx-auto">
        <button onClick={onCancel} className="mb-12 flex items-center gap-2 text-white/40 hover:text-white font-display font-black uppercase text-xs tracking-widest">
          <ArrowRight className="rotate-180" size={16} /> 돌아가기
        </button>
        
        <SectionHeading 
          badge={tournament.category.toUpperCase()} 
          title="팀 참가 신청서 작성" 
          subtitle={`${tournament.title} (3인 팀전) 신청을 위해 팀원 전체 정보를 입력해주세요.`} 
        />

        <div className="space-y-12 bg-white/[0.02] border-4 border-white/10 p-10 lg:p-16 shadow-block">
          {/* Team Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-2 h-8 bg-bs-yellow" />
              <h3 className="font-display font-black text-xl uppercase italic tracking-widest text-bs-yellow">01. 팀 정보</h3>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">우리 팀 이름 (필수)</label>
              <input 
                type="text" 
                placeholder="간지폭풍우팀"
                value={form.teamName}
                onChange={(e) => setForm({...form, teamName: e.target.value})}
                className="w-full bg-bs-bg border-2 border-white/10 p-5 font-display font-black uppercase outline-none focus:border-bs-yellow text-xl" 
              />
            </div>
          </div>

          {/* Members Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-2 h-8 bg-bs-cyan" />
              <h3 className="font-display font-black text-xl uppercase italic tracking-widest text-bs-cyan">02. 팀장 정보 (필수)</h3>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">리더 고유 ID (#8PVCC2... 형식)</label>
              <input 
                type="text" 
                placeholder="#ID_LEADER"
                value={form.leaderId}
                onChange={(e) => setForm({...form, leaderId: e.target.value})}
                className="w-full bg-bs-bg border-2 border-white/10 p-5 font-display font-black uppercase outline-none focus:border-bs-yellow text-xl" 
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-2 h-8 bg-bs-red" />
              <h3 className="font-display font-black text-xl uppercase italic tracking-widest text-bs-red">03. 연락처 및 안내</h3>
            </div>
            
            <div className="p-4 bg-bs-red/10 border border-bs-red/20 mb-6">
              <p className="text-xs font-bold text-bs-red leading-relaxed uppercase">
                ⚠️ 경고: 제공해주신 연락처(이메일, SNS, 전화번호)로 대회 일정 및 승인 안내가 발송되오니 반드시 정확히 입력해 주세요. 오입력 시 참가가 취소될 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">이메일 주소 (필수)</label>
                <input 
                  type="email" 
                  placeholder="leader@email.com"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full bg-bs-bg border-2 border-white/10 p-5 font-display font-black uppercase outline-none focus:border-bs-yellow text-xl" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">SNS 아이디 (틱톡/인스타)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    {['instagram', 'tiktok'].map(type => (
                      <button
                        key={type}
                        onClick={() => setForm({...form, snsType: type})}
                        className={`flex-1 py-3 border-2 font-display font-black text-[10px] uppercase tracking-widest transition-all ${form.snsType === type ? 'bg-bs-yellow text-black border-bs-yellow' : 'border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="@sns_id"
                    value={form.sns}
                    onChange={(e) => setForm({...form, sns: e.target.value})}
                    className="w-full bg-bs-bg border-2 border-white/10 p-5 font-display font-black uppercase outline-none focus:border-bs-yellow text-xl" 
                  />
                </div>
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">대표 연락처 (휴대폰 필수)</label>
                <input 
                  type="text" 
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full bg-bs-bg border-2 border-white/10 p-5 font-display font-black uppercase outline-none focus:border-bs-yellow text-xl" 
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <button 
              onClick={() => {
                const registrationData = {
                  ...form,
                  brawlId: `${form.teamName} [${form.leaderId}]`
                };
                onSubmit(registrationData);
              }}
              className="w-full py-8 bg-bs-red text-white font-display font-black text-2xl uppercase tracking-widest shadow-block hover:-translate-x-1 hover:-translate-y-1 transition-transform flex items-center justify-center gap-4 group"
            >
              {tournament.fee !== '초청제' && tournament.fee !== '무료' && tournament.fee !== '₩0' && tournament.fee !== '0' ? (
                <>
                  <CreditCard className="group-hover:animate-bounce" /> 결제하고 참가 신청하기 ({tournament.fee})
                </>
              ) : (
                '팀 참가 신청 완료하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DetailView = ({ tournament, onCancel, onRegister, matches }: { tournament: any, onCancel: () => void, onRegister: () => void, matches: any[] }) => {
  const theme = TOURNAMENT_THEMES.find(t => t.id === tournament.theme) || TOURNAMENT_THEMES[0];
  const tournamentMatches = matches.filter(m => String(m.tournamentId) === String(tournament.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[120] bg-bs-bg overflow-y-auto p-6 md:p-20"
    >
      <div className="max-w-5xl mx-auto">
        <button onClick={onCancel} className="mb-12 flex items-center gap-2 text-white/40 hover:text-white font-display font-black uppercase text-xs tracking-widest">
          <ArrowRight className="rotate-180" size={16} /> 리스트로 돌아가기
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <SectionHeading 
              badge={tournament.category.toUpperCase()} 
              title={tournament.title} 
              subtitle="대회 상세 규정 및 진행 방식을 확인하세요." 
            />

            <OperatorGuide />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/[0.05] border-2 border-white/10">
                <div className="text-[10px] font-black uppercase text-white/40 mb-2">게임 맵</div>
                <div className="font-display font-black text-2xl uppercase italic text-bs-cyan">{tournament.mapName}</div>
              </div>
              <div className="p-6 bg-white/[0.05] border-2 border-white/10">
                <div className="text-[10px] font-black uppercase text-white/40 mb-2">시작 일시</div>
                <div className="font-display font-black text-2xl uppercase italic text-bs-yellow">
                  {new Date(tournament.startTime).toLocaleString('ko-KR')}
                </div>
              </div>
            </div>

            {tournamentMatches.length > 0 && (
              <div className="space-y-8 pt-12 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Flame className="text-bs-red" size={24} />
                  <h4 className="font-display font-black text-2xl uppercase italic tracking-tighter">진행 중인 경기 대전표</h4>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {tournamentMatches.map((m: any) => (
                    <div key={m.id} className="p-8 bg-white/[0.03] border-2 border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-bs-yellow/50 transition-all">
                      <div className="flex-1 flex items-center justify-around w-full gap-4">
                         <div className="text-center space-y-2">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">TEAM A</div>
                            <div className="font-display font-black text-xl uppercase italic text-bs-cyan">{m.teamAName}</div>
                            {m.winnerId === m.teamAId && <Medal className="mx-auto text-bs-yellow" size={20} />}
                         </div>
                         <div className="flex flex-col items-center">
                            <div className="font-display font-black text-3xl text-bs-red italic opacity-50 group-hover:opacity-100 transition-opacity">VS</div>
                            <div className="text-[10px] font-mono text-white/20 mt-1 font-black">ROUND {m.round}</div>
                         </div>
                         <div className="text-center space-y-2">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">TEAM B</div>
                            <div className="font-display font-black text-xl uppercase italic text-bs-cyan">{m.teamBName}</div>
                            {m.winnerId === m.teamBId && <Medal className="mx-auto text-bs-yellow" size={20} />}
                         </div>
                      </div>
                      <div className="shrink-0 flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                         <div className={`w-full md:w-auto text-center px-6 py-3 bg-black/40 border border-white/5 text-[10px] font-black uppercase tracking-widest ${MATCH_STATUS_MAP[m.status]?.color}`}>
                            {MATCH_STATUS_MAP[m.status]?.label}
                         </div>
                         {m.streamStatus === 'live' && m.streamUrl && (
                            <a 
                              href={m.streamUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-bs-red text-white text-[10px] font-black uppercase tracking-widest animate-pulse hover:scale-105 transition-all"
                            >
                              <Video size={14} /> LIVE 관전
                            </a>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-invert max-w-none space-y-8 font-bold text-white/60 uppercase tracking-tight">
            <div className="p-10 bg-white/[0.02] border-2 border-white/10">
              <h4 className="text-bs-yellow text-xl mb-4 font-black italic">운영 및 경기 규칙</h4>
              <ul className="list-disc pl-6 space-y-3">
                <li>각 팀의 대표 참가자는 경기 전 운영자(luckydeduking)에게 반드시 친구 추가를 해야 합니다.</li>
                <li>운영자는 모든 경기를 직접 관전하며, 공식 결과는 운영자 확인 후 확정됩니다.</li>
                <li>일부 주요 경기는 운영자에 의해 실시간 스트리밍 중계될 수 있습니다.</li>
                <li>운영자가 입력한 결과만이 최종 판정의 기준이며, 참가자 자가 보고 결과는 참고용입니다.</li>
                <li>경기 중 발생하는 분쟁은 관리자 확인 시스템에 의해 최종 결정됩니다.</li>
                <li>부정 행위 적발 시 즉시 실격 및 플랫폼 이용이 영구 제한됩니다.</li>
              </ul>
            </div>
            <div className="p-10 bg-white/[0.02] border-2 border-white/10">
              <h4 className="text-bs-cyan text-xl mb-4 font-black italic">상금 지급</h4>
              <ul className="list-disc pl-6 space-y-3">
                <li>최종 우승 확정 후 24시간 이내에 등록된 계좌/포인트로 지급됩니다.</li>
                <li>제세공과금은 본인 부담일 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className={`p-10 bg-${theme.color} ${theme.color === 'bs-yellow' ? 'text-black' : 'text-white'} shadow-block`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.color === 'bs-yellow' ? 'opacity-60' : 'text-white/60'}`}>총 상금</div>
            <div className="font-display font-black text-5xl italic tracking-tighter mb-8">{tournament.prize}</div>
            
            <div className={`space-y-4 mb-10 ${theme.color === 'bs-yellow' ? 'text-black' : 'text-white'}`}>
              <div className={`flex justify-between border-b ${theme.color === 'bs-yellow' ? 'border-black/10' : 'border-white/10'} py-2`}>
                <span className="text-[10px] font-black uppercase">참가비</span>
                <span className="font-display font-black">{tournament.fee}</span>
              </div>
              <div className={`flex justify-between border-b ${theme.color === 'bs-yellow' ? 'border-black/10' : 'border-white/10'} py-2`}>
                <span className="text-[10px] font-black uppercase">게임 모드</span>
                <span className="font-display font-black">{TOURNAMENT_MODES.find(m => m.id === tournament.mode)?.name || '기본'}</span>
              </div>
              <div className={`flex justify-between border-b ${theme.color === 'bs-yellow' ? 'border-black/10' : 'border-white/10'} py-2`}>
                <span className="text-[10px] font-black uppercase">최대 인원</span>
                <span className="font-display font-black">{tournament.players}명</span>
              </div>
            </div>

            <button 
              onClick={onRegister}
              className={`w-full py-6 ${theme.color === 'bs-yellow' ? 'bg-black text-white' : 'bg-white text-black'} font-display font-black text-xl uppercase tracking-widest hover:scale-105 transition-all`}
            >
              지금 참가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
  );
};

const StaticPageView = ({ title, content, onBack }: { title: string, content: string, onBack: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[150] bg-bs-bg overflow-y-auto p-10 lg:p-32"
  >
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-12 flex items-center gap-2 text-white/40 hover:text-white font-display font-black uppercase text-xs tracking-[0.4em]">
        <ArrowRight className="rotate-180" size={16} /> 돌아가기
      </button>
      <div className="mb-16">
        <h2 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter mb-8 leading-none italic text-bs-yellow">{title}</h2>
        <div className="w-20 h-2 bg-bs-yellow" />
      </div>
      <div className="prose prose-invert max-w-none text-lg text-white/60 font-medium leading-relaxed uppercase tracking-tight whitespace-pre-wrap">
        {content}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = ({ 
  onClose, 
  tournaments, 
  updateStatus, 
  deleteTournament,
  showCreateModal,
  setShowCreateModal,
  newT,
  setNewT,
  addTournament,
  approveRegistration,
  notices,
  activeAlerts,
  addNotice,
  removeNotice,
  triggerUrgentAlert,
  removeUrgentAlert,
  liveSettings,
  setLiveSettings,
  currentUser,
  matches,
  updateMatch,
  addMatch
}: any) => {
  const [activeTab, setActiveTab] = useState('tournaments');
  const [noticeInput, setNoticeInput] = useState('');
  const [noticeDuration, setNoticeDuration] = useState('60'); 
  const [urgentInput, setUrgentInput] = useState('');
  const [urgentDuration, setUrgentDuration] = useState('5'); 
  const [smtpStatus, setSmtpStatus] = useState<any>(null);

  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newM, setNewM] = useState({
    tournamentId: '',
    round: 1,
    matchNumber: 1,
    teamAId: '',
    teamBId: '',
    teamAName: '',
    teamBName: '',
    teamALeaderTag: '',
    teamBLeaderTag: '',
    status: 'waiting'
  });

  const [winningMatch, setWinningMatch] = useState<any>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  
  const menuItems = [
    { id: 'tournaments', label: '대회 관리', icon: LayoutDashboard },
    { id: 'approvals', label: '참가 승인', icon: Shield },
    { id: 'matches', label: '경기 관리 (운영)', icon: Video },
    { id: 'live', label: '라이브 관리', icon: Tv },
    { id: 'notices', label: '공지 발송', icon: Bell },
    { id: 'system', label: '시스템 진단', icon: Settings },
  ];

  const testSmtp = async () => {
    setSmtpStatus({ loading: true });
    try {
      const resp = await fetch('/api/test-smtp', { method: 'POST' });
      const data = await resp.json();
      setSmtpStatus(data);
    } catch (err: any) {
      setSmtpStatus({ success: false, error: err.message });
    }
  };

  const statuses = ['draft', 'published', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'];

  const pendingApprovals = tournaments.flatMap(t => 
    (t.registrations || [])
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({ ...r, tournamentTitle: t.title, tournamentId: t.id }))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] bg-bs-bg flex flex-col font-sans"
    >
      <AnimatePresence>
        {showCreateModal && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-bs-bg border-4 border-bs-yellow max-w-2xl w-full p-12 relative"
            >
              <h3 className="font-display font-black text-4xl uppercase italic mb-8 italic">신규 대회 생성</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 overflow-y-auto max-h-[60vh] pr-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">대회 명칭</label>
                  <input 
                    type="text" 
                    value={newT.title}
                    onChange={(e) => setNewT({...newT, title: e.target.value})}
                    placeholder="대회 이름을 입력하세요"
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">카테고리</label>
                  <select 
                    value={newT.category}
                    onChange={(e) => setNewT({...newT, category: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow"
                  >
                    {TOURNAMENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">상금 규모</label>
                  <input 
                    type="text" 
                    value={newT.prize}
                    onChange={(e) => setNewT({...newT, prize: e.target.value})}
                    placeholder="예: ₩100,000"
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">최대 인원</label>
                  <input 
                    type="number" 
                    value={newT.players}
                    onChange={(e) => setNewT({...newT, players: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">비주얼 테마</label>
                  <select 
                    value={newT.theme}
                    onChange={(e) => setNewT({...newT, theme: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow"
                  >
                    {TOURNAMENT_THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">사용 맵 (Map Name)</label>
                  <input 
                    type="text" 
                    value={newT.mapName}
                    onChange={(e) => setNewT({...newT, mapName: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40">게임 모드</label>
                  <select 
                    value={newT.mode}
                    onChange={(e) => setNewT({...newT, mode: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow"
                  >
                    {TOURNAMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-white/40">대회 시작 일시</label>
                  <input 
                    type="datetime-local" 
                    value={newT.startTime}
                    onChange={(e) => setNewT({...newT, startTime: e.target.value})}
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-display font-black uppercase outline-none focus:border-bs-yellow" 
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={addTournament}
                  className="flex-1 py-6 bg-bs-red text-white font-display font-black text-xl uppercase tracking-widest shadow-block hover:-translate-x-1 hover:-translate-y-1 transition-transform"
                >
                  생성 완료
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-10 py-6 border-2 border-white/20 font-display font-black text-xl uppercase tracking-widest hover:bg-white/10"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex border-b border-white/10 px-10 py-6 items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-bs-red text-white rotate-[-4deg]">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tighter italic">ADMIN CORE CONTROL</h2>
            <div className="text-[10px] font-bold text-bs-red uppercase tracking-[0.4em]">system level access enabled</div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2 border-2 border-white/20 hover:bg-white hover:text-black font-display font-black text-xs uppercase tracking-widest transition-all"
        >
          콘솔 종료
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-white/10 flex flex-col p-6 gap-2 bg-white/[0.01]">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-none font-display font-black text-xs uppercase tracking-widest transition-all border-2 ${activeTab === item.id ? 'bg-bs-yellow text-black border-bs-yellow shadow-[5px_5px_0px_white]' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={18} />
              <div className="flex items-center justify-between w-full">
                <span>{item.label}</span>
                {item.id === 'approvals' && pendingApprovals.length > 0 && (
                  <span className="bg-bs-red text-white text-[8px] px-1.5 py-0.5 animate-pulse">{pendingApprovals.length}</span>
                )}
              </div>
            </button>
          ))}
          <div className="mt-auto p-6 bg-bs-yellow/10 border-2 border-bs-yellow/20">
             <div className="text-[10px] font-black uppercase text-bs-yellow mb-2">관리자 인증 상태</div>
             <div className="flex items-center gap-2 text-xs font-bold text-bs-cyan uppercase">
                <div className="w-2 h-2 bg-bs-cyan rounded-full animate-pulse" />
                ROOT AUTHORIZED
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-transparent to-bs-red/5">
          {activeTab === 'tournaments' && (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <SectionHeading 
                  badge="Tournament Manager"
                  title="대회 생성 및 상태 제어"
                  subtitle="모든 대회의 생명주기를 관리하고 자동화 대진표를 구축합니다."
                />
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-bs-red text-white font-display font-black uppercase tracking-widest hover:scale-105 transition-all shadow-block"
                >
                  대회 생성하기
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {tournaments.length === 0 && <div className="p-20 border-2 border-white/5 border-dashed text-center font-display font-black text-white/10 text-2xl">등록된 대회가 없습니다.</div>}
                {tournaments.map(t => (
                  <div key={t.id} className="p-6 bg-white/5 border-2 border-white/10 flex items-center justify-between group hover:border-bs-yellow transition-all">
                    <div className="flex items-center gap-8">
                      <div className="w-12 h-12 bg-white/5 flex items-center justify-center font-display font-black text-xl italic text-white/20">#{t.id}</div>
                      <div>
                        <div className="font-display font-black text-xl uppercase tracking-tighter">{t.title}</div>
                        <div className="flex gap-4 mt-1">
                           <span className="text-[10px] font-black uppercase text-white/40">{t.category}</span>
                           <span className={`text-[10px] font-black uppercase italic ${t.status === 'live' ? 'text-bs-red animate-pulse' : 'text-bs-cyan'}`}>{t.status}</span>
                           <span className="text-[10px] font-black uppercase text-white/40">신청: {t.registrations?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <select 
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className="bg-bs-bg border-2 border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-bs-yellow"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="px-4 py-2 bg-white/10 hover:bg-bs-yellow hover:text-black font-display font-black text-[10px] uppercase tracking-widest">배진표</button>
                      <button 
                        onClick={() => deleteTournament(t.id)}
                        className="px-4 py-2 bg-white/10 hover:bg-bs-red hover:text-white font-display font-black text-[10px] uppercase tracking-widest"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-8">
              <SectionHeading badge="Approve Entry" title="실시간 참가 승인" subtitle="사용자들이 신청한 토너먼트 참가 요청을 검토하고 승인합니다." />
              <div className="space-y-4">
                {pendingApprovals.length === 0 && (
                  <div className="p-20 border-2 border-white/5 border-dashed text-center font-display font-black text-white/10 text-2xl italic">대기중인 참가 신청이 없습니다.</div>
                )}
                {pendingApprovals.map((reg: any) => (
                  <div key={reg.id} className="p-8 bg-white/5 border-2 border-white/10 flex items-center justify-between group hover:border-bs-cyan transition-all">
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-bs-cyan uppercase mb-1 tracking-widest">[{reg.tournamentTitle}]</div>
                      <div className="font-display font-black text-2xl uppercase italic tracking-tighter mb-4">{reg.brawlId}</div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <label className="text-[8px] font-black uppercase text-white/20">이메일</label>
                          <div className="text-xs font-bold">{reg.email}</div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-white/20">연락처</label>
                          <div className="text-xs font-bold">{reg.phone || '-'}</div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-white/20">SNS ({reg.snsType})</label>
                          <div className="text-xs font-bold text-bs-yellow">{reg.sns || '-'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 ml-8">
                      <button 
                        onClick={() => approveRegistration(reg.tournamentId, reg.id)}
                        className="px-6 py-3 bg-bs-cyan text-black font-display font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        승인 완료
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-8">
              <SectionHeading badge="Theme Showcase" title="비주얼 테마 프리뷰" subtitle="각 테마가 실제 대회 카드에서 어떻게 보여지는지 실시간으로 확인하세요." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {TOURNAMENT_THEMES.map(theme => (
                  <div key={theme.id} className="space-y-4">
                    <div className="text-xs font-black uppercase text-white/40 tracking-[0.2em] px-2">{theme.name}</div>
                    <TournamentCard 
                      tournament={{
                        id: 0,
                        title: 'PREVIEW TOURNAMENT',
                        theme: theme.id,
                        prize: '₩1,000,000',
                        fee: '₩1,000',
                        players: 100,
                        mapName: '스네이크 초원',
                        startTime: new Date().toISOString(),
                        registrations: []
                      }}
                      onRegister={() => {}}
                      onDetail={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-12">
              <div className="space-y-8">
                <SectionHeading badge="Marquee Notice" title="상단 흐르는 공지 발송" subtitle="홈페이지 상단에 일정 시간 동안 노출될 공지를 작성합니다." />
                
                <div className="bg-white/5 border-2 border-white/10 p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">공지 내용</label>
                      <input 
                        type="text" 
                        value={noticeInput}
                        onChange={(e) => setNoticeInput(e.target.value)}
                        placeholder="공지 내용을 입력하세요..."
                        className="w-full bg-bs-bg border-2 border-white/10 p-5 font-bold outline-none focus:border-bs-yellow" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">노출 시간 (분)</label>
                      <input 
                        type="number" 
                        value={noticeDuration}
                        onChange={(e) => setNoticeDuration(e.target.value)}
                        className="w-full bg-bs-bg border-2 border-white/10 p-5 font-bold outline-none focus:border-bs-yellow" 
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          if (noticeInput.trim()) {
                            addNotice(noticeInput, noticeDuration ? parseInt(noticeDuration) : 0);
                            setNoticeInput('');
                          }
                        }}
                        className="w-full h-[68px] bg-bs-yellow text-black font-display font-black uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        공지 발송
                      </button>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/10">
                    <div className="text-[10px] font-black uppercase text-white/40 mb-6 font-display italic">활성화된 상단 공지</div>
                    <div className="space-y-4">
                        {notices.map(notice => {
                          const isExpired = notice.expiresAt && notice.expiresAt < Date.now();
                          return (
                            <div key={notice.id} className={`p-6 bg-white/5 border border-white/10 flex items-center justify-between group ${isExpired ? 'opacity-30' : ''}`}>
                              <div className="flex items-center gap-6">
                                <div className="p-2 bg-bs-yellow/20 text-bs-yellow uppercase text-[8px] font-black italic">marquee</div>
                                <div className="font-bold text-sm tracking-tight">{notice.content}</div>
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="text-[10px] text-white/20 font-medium">
                                  {notice.expiresAt ? `만료: ${new Date(notice.expiresAt).toLocaleTimeString()}` : '영구'}
                                </span>
                                <button 
                                  onClick={() => removeNotice(notice.id)}
                                  className="text-bs-red opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Shield size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <SectionHeading badge="Urgent Alert" title="상단 팝업 긴급 공지" subtitle="모든 사용자 화면 상단에서 내려오는 긴급 알림을 발령합니다." />
                
                <div className="bg-bs-red/5 border-2 border-bs-red/20 p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black uppercase text-bs-red/60 tracking-widest">긴급 메시지</label>
                      <input 
                        type="text" 
                        value={urgentInput}
                        onChange={(e) => setUrgentInput(e.target.value)}
                        placeholder="긴급 메시지를 입력하세요..."
                        className="w-full bg-bs-bg border-2 border-bs-red/20 p-5 font-bold outline-none focus:border-bs-red text-bs-red" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-bs-red/60 tracking-widest">노출 시간 (초)</label>
                      <input 
                        type="number" 
                        value={urgentDuration}
                        onChange={(e) => setUrgentDuration(e.target.value)}
                        className="w-full bg-bs-bg border-2 border-bs-red/20 p-5 font-bold outline-none focus:border-bs-red text-bs-red" 
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          if (urgentInput.trim()) {
                            triggerUrgentAlert(urgentInput, 'urgent', parseInt(urgentDuration));
                            setUrgentInput('');
                          }
                        }}
                        className="w-full h-[68px] bg-bs-red text-white font-display font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,100,100,0.3)]"
                      >
                        긴급 경보 발령
                      </button>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-bs-red/10">
                    <div className="text-[10px] font-black uppercase text-bs-red/40 mb-6 font-display italic">활성화된 긴급 경보</div>
                    <div className="space-y-4">
                        {activeAlerts.map(alert => (
                          <div key={alert.id} className="p-6 bg-bs-red/10 border border-bs-red/20 flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                              <div className="p-2 bg-bs-red text-white uppercase text-[8px] font-black italic">urgent</div>
                              <div className="font-bold text-sm tracking-tight text-bs-red">{alert.content}</div>
                            </div>
                            <button 
                              onClick={() => removeUrgentAlert(alert.id)}
                              className="text-white bg-bs-red p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Shield size={16} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-12">
              <SectionHeading badge="Match Control" title="운영자 직접 관전 및 경기 관리" subtitle="실시간 경기 대전표를 관리하고 공식 승패 결과를 확정합니다." />
              
              <div className="flex justify-end gap-4 mb-8">
                 <button 
                   onClick={() => setShowAddMatch(true)}
                   className="px-8 py-4 bg-bs-cyan text-black font-display font-black text-xs uppercase tracking-widest shadow-block-cyan hover:-translate-x-1 hover:-translate-y-1 transition-all"
                 >
                   + 경기 대전 생성 (MOCK)
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-10">
                 {matches.length === 0 && (
                   <div className="p-32 border-2 border-white/5 border-dashed text-center text-white/10 font-display font-black text-4xl italic">생성된 경기가 없습니다.</div>
                 )}
                 {matches.map((m: any) => (
                   <div key={m.id} className="relative bg-white/5 border-2 border-white/10 p-10 group hover:border-bs-yellow transition-all">
                      <div className="absolute top-4 right-4 flex gap-2">
                         <span className={`px-3 py-1 text-[8px] font-black uppercase italic ${MATCH_STATUS_MAP[m.status]?.color || 'text-white'}`}>
                            {MATCH_STATUS_MAP[m.status]?.label || m.status}
                         </span>
                         {m.streamStatus === 'live' && (
                           <span className="px-3 py-1 bg-bs-red text-white text-[8px] font-black uppercase animate-pulse">STREAMING LIVE</span>
                         )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
                         <div className="text-center space-y-4">
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">TEAM A</div>
                            <div className="font-display font-black text-3xl uppercase italic text-bs-cyan">{m.teamAName || 'TBD'}</div>
                            <div className="text-xs font-mono text-white/40">TAG: {m.teamALeaderTag || '-'}</div>
                         </div>

                         <div className="flex flex-col items-center gap-6">
                            <div className="font-display font-black text-6xl text-bs-red italic select-none">VS</div>
                            <div className="flex items-center gap-4 bg-black/40 px-6 py-2 border border-white/10 font-mono text-2xl font-black">
                               <span className={m.winnerId === m.teamAId ? 'text-bs-yellow' : ''}>{m.scoreA || 0}</span>
                               <span className="text-white/20">:</span>
                               <span className={m.winnerId === m.teamBId ? 'text-bs-yellow' : ''}>{m.scoreB || 0}</span>
                            </div>
                         </div>

                         <div className="text-center space-y-4">
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">TEAM B</div>
                            <div className="font-display font-black text-3xl uppercase italic text-bs-cyan">{m.teamBName || 'TBD'}</div>
                            <div className="text-xs font-mono text-white/40">TAG: {m.teamBLeaderTag || '-'}</div>
                         </div>
                      </div>

                      <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="space-y-3">
                            <label className="text-[8px] font-black uppercase text-white/20 opacity-50">경기 상태</label>
                            <select 
                              value={m.status} 
                              onChange={(e) => updateMatch(m.id, { status: e.target.value })}
                              className="w-full bg-bs-bg border border-white/10 p-4 text-[10px] font-black uppercase outline-none focus:border-bs-yellow"
                            >
                               {Object.keys(MATCH_STATUS_MAP).map(k => (
                                 <option key={k} value={k}>{MATCH_STATUS_MAP[k].label}</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[8px] font-black uppercase text-white/20 opacity-50">관전 상태</label>
                            <select 
                              value={m.operatorObservationStatus} 
                              onChange={(e) => updateMatch(m.id, { operatorObservationStatus: e.target.value })}
                              className="w-full bg-bs-bg border border-white/10 p-4 text-[10px] font-black uppercase outline-none focus:border-bs-yellow"
                            >
                               {Object.keys(OBSERVATION_STATUS_MAP).map(k => (
                                 <option key={k} value={k}>{OBSERVATION_STATUS_MAP[k]}</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-3">
                             <label className="text-[8px] font-black uppercase text-white/20 opacity-50">중계 링크</label>
                             <input 
                               type="text"
                               value={m.streamUrl || ''}
                               onChange={(e) => updateMatch(m.id, { streamUrl: e.target.value })}
                               className="w-full bg-bs-bg border border-white/10 p-4 text-[10px] font-black outline-none focus:border-bs-yellow"
                               placeholder="URL..."
                             />
                         </div>
                         <div className="flex items-end">
                            <button 
                              onClick={() => {
                                 const winner = prompt("승리 팀 선택 (A: Team A, B: Team B)");
                                 if (winner === 'A') updateMatch(m.id, { winnerId: m.teamAId, status: 'completed' });
                                 else if (winner === 'B') updateMatch(m.id, { winnerId: m.teamBId, status: 'completed' });
                              }}
                              className="w-full py-4 bg-bs-yellow text-black font-display font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                            >
                               공식 결과 확정
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              {showAddMatch && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6">
                   <div className="bg-bs-bg border-4 border-bs-cyan p-10 max-w-2xl w-full space-y-8">
                      <div className="flex justify-between items-center">
                         <h3 className="font-display font-black text-3xl uppercase italic text-bs-cyan">새 경기 생성</h3>
                         <button onClick={() => setShowAddMatch(false)} className="text-white/40 hover:text-white"><Shield size={24} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/40">TEAM A NAME</label>
                           <input type="text" onChange={(e) => setNewM({...newM, teamAName: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/40">TEAM B NAME</label>
                           <input type="text" onChange={(e) => setNewM({...newM, teamBName: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/40">TEAM A LEADER TAG</label>
                           <input type="text" onChange={(e) => setNewM({...newM, teamALeaderTag: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/40">TEAM B LEADER TAG</label>
                           <input type="text" onChange={(e) => setNewM({...newM, teamBLeaderTag: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4" />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          addMatch({...newM, teamAId: 'id-a', teamBId: 'id-b'});
                          setShowAddMatch(false);
                        }}
                        className="w-full py-6 bg-bs-cyan text-black font-display font-black uppercase tracking-widest"
                      >
                         경기 대전표 등록
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'live' && (
            <div className="space-y-12">
              <SectionHeading badge="Live Operations" title="실시간 경기 관리" subtitle="현재 진행 중인 경기를 히어로 영역에 노출하고 라이브 스트리밍을 연동합니다." />
              
              <div className="bg-white/5 border-2 border-white/10 p-10 space-y-10 shadow-block">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-bs-red" />
                      <h4 className="font-display font-black text-xl uppercase italic">LIVE 토글</h4>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setLiveSettings({...liveSettings, isLive: !liveSettings.isLive})}
                        className={`flex-1 py-4 font-display font-black text-xs uppercase tracking-widest border-2 transition-all ${liveSettings.isLive ? 'bg-bs-red border-bs-red text-white shadow-glow-red' : 'border-white/10 text-white/40'}`}
                      >
                        {liveSettings.isLive ? 'LIVE ON' : 'LIVE OFF'}
                      </button>
                      <button 
                        onClick={() => setLiveSettings({...liveSettings, showLiveButton: !liveSettings.showLiveButton})}
                        className={`flex-1 py-4 font-display font-black text-xs uppercase tracking-widest border-2 transition-all ${liveSettings.showLiveButton ? 'bg-bs-cyan border-bs-cyan text-black shadow-glow-cyan' : 'border-white/10 text-white/40'}`}
                      >
                        {liveSettings.showLiveButton ? '버튼 활성화됨' : '대진표 버튼 유지'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-bs-yellow" />
                      <h4 className="font-display font-black text-xl uppercase italic">라이브 링크</h4>
                    </div>
                    <input 
                      type="text" 
                      value={liveSettings.liveUrl}
                      onChange={(e) => setLiveSettings({...liveSettings, liveUrl: e.target.value})}
                      placeholder="https://youtube.com/live/..."
                      className="w-full bg-bs-bg border-2 border-white/10 p-5 font-bold outline-none focus:border-bs-yellow" 
                    />
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 bg-bs-cyan" />
                      <h4 className="font-display font-black text-xl uppercase italic">대결 팀 설정</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <input 
                        type="text" 
                        value={liveSettings.teamA}
                        onChange={(e) => setLiveSettings({...liveSettings, teamA: e.target.value})}
                        className="w-full bg-bs-bg border-2 border-bs-cyan/20 p-5 font-display font-black uppercase text-xl text-bs-cyan" 
                      />
                      <div className="text-center font-display font-black text-4xl italic text-bs-red">VS</div>
                      <input 
                        type="text" 
                        value={liveSettings.teamB}
                        onChange={(e) => setLiveSettings({...liveSettings, teamB: e.target.value})}
                        className="w-full bg-bs-bg border-2 border-bs-cyan/20 p-5 font-display font-black uppercase text-xl text-bs-cyan" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-12">
              <SectionHeading badge="System Diagnostics" title="시스템 자가 진단 및 테스트" subtitle="이메일 발송 상태 및 서버 연결 상태를 점검합니다." />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white/5 border-2 border-white/10 p-10 space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Bell className="text-bs-yellow" size={24} />
                    <h4 className="font-display font-black text-2xl uppercase italic">이메일(SMTP) 테스트</h4>
                  </div>
                  <p className="text-sm text-white/40 font-medium leading-relaxed uppercase">
                    관리자 메일로 테스트 메일을 발송하여 발송 엔진의 상태를 점검합니다.<br />
                    (현재 수신처: sihumin196@gmail.com)
                  </p>
                  
                  <button 
                    onClick={testSmtp}
                    disabled={smtpStatus?.loading}
                    className="w-full py-6 bg-bs-yellow text-black font-display font-black text-xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {smtpStatus?.loading ? '진단 중...' : 'SMTP 연결 테스트'}
                  </button>

                  {smtpStatus && (
                    <div className={`p-6 border-2 font-mono text-xs uppercase leading-relaxed ${smtpStatus.success ? 'bg-bs-cyan/10 border-bs-cyan text-bs-cyan' : 'bg-bs-red/10 border-bs-red text-bs-red'}`}>
                      <div className="font-black mb-2">{smtpStatus.success ? 'SUCCESS' : 'FAILURE'}</div>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(smtpStatus, null, 2)}</pre>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <h5 className="font-display font-black text-xs uppercase text-bs-yellow">SMTP 설정 가이드 (Gmail 기준)</h5>
                    <ul className="text-[10px] text-white/40 space-y-2 uppercase leading-relaxed list-disc pl-4">
                      <li>구글 계정 상단 <strong>2단계 인증</strong> 활성화</li>
                      <li>보안 메뉴 하단 <strong>'앱 비밀번호'</strong> 생성 (앱 이름: BSK ARENA)</li>
                      <li>생성된 16자리 코드를 <code>SMTP_PASS</code>에 입력</li>
                      <li><code>SMTP_USER</code>: 본인 이메일 주소</li>
                      <li><code>SMTP_HOST</code>: smtp.gmail.com</li>
                      <li><code>SMTP_PORT</code>: 587</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 border-2 border-white/10 p-10 space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Shield className="text-bs-cyan" size={24} />
                    <h4 className="font-display font-black text-2xl uppercase italic">보안 세션 정보</h4>
                  </div>
                  <div className="space-y-4 font-mono text-xs text-white/40">
                    <div className="flex justify-between border-b border-white/5 py-2">
                       <span>AUTH TYPE</span>
                       <span className="text-bs-cyan">GOOGLE_OAUTH2</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-2">
                       <span>ADMIN EMAIL</span>
                       <span className="text-bs-cyan">{currentUser?.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-2">
                       <span>SESSION ID</span>
                       <span className="text-bs-cyan tracking-tighter">{auth.currentUser?.uid}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <SectionHeading badge="User Controls" title="전체 참가자 기반 관리" subtitle="플랫폼에 등록된 모든 플레이어 정보를 관리합니다." />
              <div className="bg-white/5 border-2 border-white/10 shadow-block">
                 <div className="grid grid-cols-5 p-4 border-b border-white/10 font-display font-black text-[10px] uppercase tracking-widest text-white/40">
                    <span>플레이어</span>
                    <span>브롤 ID</span>
                    <span>가입일</span>
                    <span>상태</span>
                    <span>액션</span>
                 </div>
                 {tournaments.flatMap(t => t.registrations || []).map((u: any, i) => (
                   <div key={i} className="grid grid-cols-5 p-6 border-b border-white/5 last:border-0 items-center">
                      <span className="font-display font-black text-sm uppercase">{u.email?.split('@')[0] || 'Unknown'}</span>
                      <span className="text-xs font-bold text-bs-yellow uppercase italic">{u.brawlId}</span>
                      <span className="text-xs font-bold text-white/40">{new Date(u.id).toLocaleDateString()}</span>
                      <span className={`text-[10px] font-black uppercase ${u.status === 'approved' ? 'text-bs-cyan' : 'text-bs-red'}`}>{u.status}</span>
                      <div className="flex gap-4">
                         <button className="text-[10px] font-black uppercase text-bs-red hover:underline">강퇴</button>
                         <button className="text-[10px] font-black uppercase text-bs-yellow hover:underline">제재</button>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passInput, setPassInput] = useState('');

  // --- Persistence Loading for Live Settings ---
  const [liveSettings, setLiveSettings] = useState(() => {
    const saved = localStorage.getItem('live_settings');
    return saved ? JSON.parse(saved) : {
      isLive: false,
      liveUrl: 'https://youtube.com/live',
      teamA: 'TEAM A',
      teamB: 'TEAM B',
      showLiveButton: false
    };
  });

  useEffect(() => {
    localStorage.setItem('live_settings', JSON.stringify(liveSettings));
  }, [liveSettings]);

  const [staticPage, setStaticPage] = useState<{title: string, content: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === 'sihumin196@gmail.com') {
        setIsAdminOpen(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Payment Return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment_status');
    const tId = params.get('tournament_id');

    if (status === 'success' && tId) {
      const pending = localStorage.getItem('pending_registration');
      if (pending) {
        const { tournamentId, formData } = JSON.parse(pending);
        if (String(tournamentId) === String(tId)) {
          // Finalize registration
          setTournaments(prev => prev.map(t => {
            if (String(t.id) === String(tournamentId)) {
              const newReg = {
                id: Date.now(),
                ...formData,
                status: 'pending',
                paid: true
              };
              return {
                ...t,
                registrations: [...(t.registrations || []), newReg]
              };
            }
            return t;
          }));
          
          localStorage.removeItem('pending_registration');
          // Clean URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          alert('결제가 완료되었습니다! 참가 신청이 정상적으로 접수되었습니다.');
        }
      }
    }
  }, []);
  
  // Persistence Loading for Tournaments
  const [tournaments, setTournaments] = useState(() => {
    const saved = localStorage.getItem('bsk_tournaments');
    return saved ? JSON.parse(saved) : [];
  });

  const [matches, setMatches] = useState<any[]>(() => {
    const saved = localStorage.getItem('bsk_matches');
    return saved ? JSON.parse(saved) : [];
  });

  const updateMatch = (matchId: string, updates: any) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updates, updatedAt: Date.now() } : m));
  };

  const addMatch = (data: any) => {
    const newMatch = { ...data, id: `match-${Date.now()}`, createdAt: Date.now() };
    setMatches(prev => [...prev, newMatch]);
  };

  useEffect(() => {
    localStorage.setItem('bsk_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('bsk_matches', JSON.stringify(matches));
  }, [matches]);

  // Firestore Notices Integration
  const [notices, setNotices] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Urgent Alerts Integration
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUrgentAlerts(data);
    });
    return () => unsubscribe();
  }, []);

  // Local filtering for display
  const activeNotices = notices.filter(n => !n.expiresAt || n.expiresAt > currentTime);
  const activeAlerts = urgentAlerts.filter((a: any) => {
    const createdAt = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a._localCreatedAt || currentTime);
    return (currentTime - createdAt) < (a.duration || 5) * 1000;
  });

  const [sentTriggers, setSentTriggers] = useState<string[]>([]);

  const triggerUrgentAlert = async (content: string, type: string = 'urgent', duration: number = 5) => {
    try {
      await addDoc(collection(db, 'alerts'), {
        content,
        type,
        duration,
        createdAt: serverTimestamp(),
        _localCreatedAt: Date.now() // For immediate local feedback
      });
    } catch (err) {
      console.error("Failed to trigger global alert:", err);
    }
  };

  const removeUrgentAlert = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', id));
    } catch (err) {
      console.error("Failed to remove alert:", err);
    }
  };

  const addNotice = async (content: string, durationMinutes: number = 0) => {
    try {
      await addDoc(collection(db, 'notices'), {
        content,
        createdAt: serverTimestamp(),
        expiresAt: durationMinutes > 0 ? Date.now() + (durationMinutes * 60 * 1000) : null
      });
    } catch (err) {
      console.error("Failed to send notice:", err);
    }
  };

  const removeNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (err) {
      console.error("Failed to remove notice:", err);
    }
  };

  // Tournament Countdown Engine
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tournaments.forEach(t => {
        if (t.status === 'published' || t.status === 'registration_open') {
          const startTime = new Date(t.startTime).getTime();
          const diffMinutes = Math.floor((startTime - now) / 60000);
          
          const checkpoints = [30, 15, 5];
          checkpoints.forEach(cp => {
            const triggerKey = `${t.id}-${cp}`;
            if (diffMinutes === cp && !sentTriggers.includes(triggerKey)) {
              triggerUrgentAlert(`[${t.title}] 대회 시작 ${cp}분 전입니다!`, 'tournament', 3);
              setSentTriggers(prev => [...prev, triggerKey]);
            }
          });
        }
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tournaments, sentTriggers]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Tournament Creation State
  const [newT, setNewT] = useState({
    title: '',
    category: 'starter',
    prize: '₩100,000',
    fee: '₩1,000',
    players: 64,
    status: 'published',
    theme: 'classic',
    mode: 'brawl_ball',
    mapName: '스네이크 초원',
    startTime: '2024-04-20T18:00'
  });

  const handleAdminAccess = () => {
    setIsAdminOpen(true);
  };

  const handleAdminAuth = async (val: string) => {
    // Keep old console for fallback or hidden access if needed, but primary is Google
    setPassInput(val);
    if (val === '43748329hru4758fjoi') {
      setIsAdminOpen(true);
      setPassInput('');
    }
  };

  const addTournament = () => {
    if (!newT.title) return;
    // Get fee from category if default wasn't changed
    const selectedCat = TOURNAMENT_CATEGORIES.find(c => c.id === newT.category);
    const t = {
      ...newT,
      fee: selectedCat?.fee || newT.fee,
      id: Date.now(),
      registrations: [] // Ensure registrations array exists
    };
    setTournaments([t, ...tournaments]);
    setShowCreateModal(false);
    setNewT({ 
      title: '', 
      category: 'starter', 
      prize: '₩100,000', 
      fee: '₩1,000', 
      players: 64, 
      status: 'published',
      theme: 'classic',
      mode: 'brawl_ball',
      mapName: '스네이크 초원',
      startTime: '2024-04-20T18:00'
    });
  };

  const updateStatus = (id: number, status: string) => {
    setTournaments(tournaments.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTournament = (id: number) => {
    setTournaments(tournaments.filter(t => t.id !== id));
  };

  // Navigation State
  const [currentView, setCurrentView] = useState('main'); // 'main', 'register', 'detail'
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  const handleRegisterEntry = (tId: number) => {
    const t = tournaments.find(t => t.id === tId);
    setSelectedTournament(t);
    setCurrentView('register');
  };

  const handleShowDetail = (tId: number) => {
    const t = tournaments.find(t => t.id === tId);
    setSelectedTournament(t);
    setCurrentView('detail');
  };

  const submitRegistration = async (formData: any) => {
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      alert("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    if (!formData.teamName) {
      alert("팀 이름을 입력해주세요.");
      return;
    }

    const hasFee = selectedTournament.fee && 
                  selectedTournament.fee !== '초청제' && 
                  selectedTournament.fee !== '무료' && 
                  selectedTournament.fee !== '₩0' && 
                  selectedTournament.fee !== '0';

    if (hasFee) {
      // 1. Initiate Payment with Dodo
      try {
        const response = await fetch('/api/payments/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament.id,
            tournamentTitle: selectedTournament.title,
            fee: selectedTournament.fee,
            customerEmail: formData.email,
            customerName: formData.teamName
          })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "결제 세션 생성 실패");
        }
        
        if (data.checkout_url) {
          // Store for recovery after redirect
          localStorage.setItem('pending_registration', JSON.stringify({
            tournamentId: selectedTournament.id,
            formData
          }));

          // If it's a mock checkout (no API key set), we warn the user
          if (data.isMock) {
             console.log("Mock Payment active. Redirecting to success internal URL.");
          }
          
          window.location.href = data.checkout_url;
          return;
        }
      } catch (err) {
        console.error("Payment failure:", err);
        alert("결제 창을 여는 데 실패했습니다. 다시 시도해 주세요.");
        return;
      }
    }

    // If free or error fallback
    setTournaments(prev => prev.map(t => {
      if (t.id === selectedTournament.id) {
        const newReg = {
          id: Date.now(),
          ...formData,
          status: 'pending'
        };
        return {
          ...t,
          registrations: [...(t.registrations || []), newReg]
        };
      }
      return t;
    }));
    alert('참가 신청이 접수되었습니다! 관리자 승인 후 안내 메일이 발송됩니다.');
    setCurrentView('main');
    setSelectedTournament(null);
  };

  const approveRegistration = async (tId: number, rId: number) => {
    const tournament = tournaments.find(t => t.id === tId);
    const registration = (tournament?.registrations || []).find((r: any) => r.id === rId);

    if (registration) {
      // 1. Call Backend API for actual email sending
      try {
        await fetch('/api/notify/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registration.email,
            userName: registration.brawlId,
            tournamentTitle: tournament.title
          })
        });
      } catch (err) {
        console.error("Failed to send email notification:", err);
      }
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tId) {
        return {
          ...t,
          registrations: (t.registrations || []).map((r: any) => 
            r.id === rId ? { ...r, status: 'approved' } : r
          )
        };
      }
      return t;
    }));
  };

  const [showAllTournaments, setShowAllTournaments] = useState(false);

  return (
    <div className="bg-bs-bg min-h-screen selection:bg-bs-purple/30 selection:text-white">
      <AnimatePresence mode="wait">
        {isAdminOpen && (
          <AdminDashboard 
            onClose={() => setIsAdminOpen(false)} 
            tournaments={tournaments}
            updateStatus={updateStatus}
            deleteTournament={deleteTournament}
            showCreateModal={showCreateModal}
            setShowCreateModal={setShowCreateModal}
            newT={newT}
            setNewT={setNewT}
            addTournament={addTournament}
            approveRegistration={approveRegistration}
            notices={notices}
            activeAlerts={activeAlerts}
            addNotice={addNotice}
            removeNotice={removeNotice}
            triggerUrgentAlert={triggerUrgentAlert}
            removeUrgentAlert={removeUrgentAlert}
            liveSettings={liveSettings}
            setLiveSettings={setLiveSettings}
            currentUser={currentUser}
            matches={matches}
            updateMatch={updateMatch}
            addMatch={addMatch}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {staticPage && (
          <StaticPageView 
            title={staticPage.title}
            content={staticPage.content}
            onBack={() => setStaticPage(null)}
          />
        )}
        {currentView === 'register' && (
          <RegistrationView 
            tournament={selectedTournament} 
            onCancel={() => setCurrentView('main')}
            onSubmit={submitRegistration}
          />
        )}
        {currentView === 'detail' && (
          <DetailView 
            tournament={selectedTournament} 
            onCancel={() => setCurrentView('main')}
            onRegister={() => setCurrentView('register')}
            matches={matches}
          />
        )}
      </AnimatePresence>

      <Navbar />
      
      <AlertOverlay 
        alerts={activeAlerts} 
        onRemove={(id) => setUrgentAlerts(prev => prev.filter(a => a.id !== id))} 
      />

      {/* System Notices Marquee */}
      {activeNotices.length > 0 && (
        <div className="fixed top-24 left-0 w-full z-[100] bg-bs-red py-3 border-y-2 border-white/20 shadow-[0_10px_30px_rgba(255,0,0,0.3)] overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array(15).fill(0).map((_, i) => (
              <div key={i} className="flex gap-20 items-center px-10">
                {activeNotices.map(notice => (
                    <div key={notice.id} className="flex items-center gap-4">
                       <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 font-black italic">NOTICE</span>
                       <span className="font-display font-black text-lg uppercase tracking-[0.2em] text-white">{notice.content}</span>
                       <span className="text-white/40 ml-4">•</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Hero 
        onRegister={() => {
          const first = tournaments[0];
          if (first) handleRegisterEntry(first.id);
        }}
        liveSettings={liveSettings}
        matches={matches}
      />

      <StatsShelf />
      
      {/* Tournament Marquee removed per user request */}

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-32">
        
        {/* Tournaments Grid */}
        <section id="tournaments">
          <SectionHeading 
            badge="TOURNAMENT CATALOG"
            title="대회 카테고리" 
            subtitle="자신의 실력에 맞는 티어를 선택하여 참가하세요. 입문부터 프로까지 모든 레벨을 지원합니다."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
            {TOURNAMENT_CATEGORIES.map(cat => (
              <div key={cat.id} className={`p-6 border-2 border-white/10 bg-white/[0.02] group hover:border-${cat.color} transition-all`}>
                <div className={`text-[10px] font-black uppercase mb-1 text-${cat.color}`}>{cat.name}</div>
                <div className="font-display font-black text-xl uppercase tracking-tighter mb-2">{cat.fee}</div>
                <p className="text-[10px] text-white/40 leading-tight font-bold uppercase">{cat.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments
              .filter(t => t.status !== 'draft')
              .slice(0, showAllTournaments ? tournaments.length : 6)
              .map(t => (
                <TournamentCard 
                  key={t.id} 
                  tournament={t} 
                  onRegister={handleRegisterEntry}
                  onDetail={handleShowDetail}
                />
              ))}
          </div>

          {!showAllTournaments && tournaments.length > 6 && (
            <div className="mt-16 flex justify-center">
              <button 
                onClick={() => setShowAllTournaments(true)}
                className="px-12 py-6 border-2 border-white/20 hover:border-bs-yellow hover:text-bs-yellow font-display font-black text-xl uppercase tracking-widest transition-all"
              >
                전체 대회 보기
              </button>
            </div>
          )}
        </section>

        {/* Bracket Showcase */}
        <section id="system">
          <BracketMockup />
        </section>

        {/* Global Rankings & Hall of Fame */}
        <section id="hall-of-fame" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeading 
              badge="전당 입성"
              title="시즌 명예의 전당"
              subtitle="각 시즌별 최상위 랭커들에게 부여되는 특별한 뱃지와 영광의 보상이 주어집니다."
            />
            
            <div className="space-y-6">
              {TOP_RANKERS.map((player, idx) => (
                <div 
                  key={idx}
                  className="group flex items-center justify-between p-8 bg-white/[0.02] border-2 border-white/5 rounded-none hover:bg-white/[0.04] hover:border-bs-yellow hover:scale-[1.01] transition-all duration-300 ease-out"
                >
                  <div className="flex items-center gap-8">
                    <span className={`font-display font-black text-4xl italic tracking-tighter ${idx === 0 ? 'text-bs-yellow' : 'text-white/20'}`}>
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <div className="w-16 h-16 rounded-none overflow-hidden border-2 border-white/10 ring-4 ring-bs-yellow/0 group-hover:ring-bs-yellow/20 transition-all">
                      <img src={`https://picsum.photos/seed/p${idx}/64/64`} alt="p" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="font-display font-black text-2xl uppercase tracking-tighter">{player.name}</div>
                      <div className="flex items-center gap-3 text-xs font-black uppercase text-white/40 tracking-[0.2em] mt-1">
                        <Flame size={14} className="text-bs-red" />
                        {player.trophies} Trophies • <span className="text-bs-cyan">{player.winRate} 승률</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-bs-yellow text-black text-[10px] font-black uppercase tracking-widest rounded-none transform rotate-2 group-hover:rotate-0 transition-all duration-300">
                    {player.badge}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-8 group flex items-center gap-2 font-display font-bold text-sm text-bs-purple uppercase tracking-widest hover:gap-4 transition-all">
              전체 랭킹 보기 <ChevronRight size={16} />
            </button>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-bs-yellow/5 blur-[80px] rounded-full" />
             <div className="relative bg-white/[0.03] border-2 border-white/10 rounded-none p-12 overflow-hidden">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-bs-yellow text-black rotate-[-3deg]">
                    <Medal size={32} />
                  </div>
                  <h3 className="font-display font-black text-3xl uppercase italic tracking-tighter">특별 배지 시스템</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { name: 'TOURNAMENT MASTER', color: 'bs-yellow' },
                    { name: 'UNDEFEATED', color: 'bs-red' },
                    { name: 'ARENA GOD', color: 'bs-cyan' },
                    { name: 'FIRST VICTORY', color: 'bs-secondary' },
                  ].map((badge, i) => (
                    <div key={i} className="p-8 rounded-none bg-white/5 border-2 border-white/5 flex flex-col items-center gap-6 text-center group transition-all duration-300 ease-out hover:bg-white/10 hover:border-bs-yellow hover:scale-105">
                      <div className={`w-20 h-20 rounded-none bg-${badge.color === 'bs-secondary' ? 'bs-red' : badge.color}/10 border-2 border-${badge.color === 'bs-secondary' ? 'bs-red' : badge.color}/20 flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,206,0,0.3)]`}>
                         <Zap className={`text-${badge.color === 'bs-secondary' ? 'bs-red' : badge.color}`} size={32} />
                      </div>
                      <span className="font-display font-black text-sm uppercase tracking-widest leading-none">{badge.name}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* Items Section Preview */}
        <section id="items" className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center bg-white/[0.02] border-4 border-white/10 rounded-none p-12 lg:p-24 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bs-yellow/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col gap-12">
              <SectionHeading 
                badge="MARKETPLACE"
                title="BSK ITEM SHOP"
                subtitle="승리의 영광을 더욱 돋보이게 하는 특별한 배지와 한정판 프로필 아이템을 만나보세요."
              />
              
              <div className="grid grid-cols-1 gap-6">
                {[
                  { title: '시즌 한정 배지팩', desc: '상위 1%만을 위한 황금빛 전설 배지 패키지' },
                  { title: '프로필 테마: 마스터', desc: '아레나 로비에서 빛나는 전용 보더 효과' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 p-8 rounded-none bg-white/[0.02] border-2 border-white/5 hover:border-bs-yellow hover:bg-white/[0.04] transition-all duration-300 ease-out group hover:scale-[1.02]">
                    <div className="w-16 h-16 bg-white/5 group-hover:bg-bs-yellow rounded-none flex items-center justify-center shrink-0 border-2 border-white/5 group-hover:border-bs-yellow transition-all duration-300">
                      <Zap className="text-bs-yellow group-hover:text-black transition-colors duration-300" size={32} />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-2xl uppercase mb-3 tracking-tighter leading-none">{item.title}</h4>
                      <p className="text-base text-white/50 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group p-4 border-2 border-white/10 bg-bs-bg shadow-[20px_20px_0px_white]">
              <div className="relative bg-bs-bg border-2 border-white/20 rounded-none overflow-hidden">
                 <div className="p-6 border-b-2 border-white/10 flex items-center justify-between bg-white/[0.03]">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-none bg-bs-red" />
                      <div className="w-3 h-3 rounded-none bg-bs-yellow" />
                      <div className="w-3 h-3 rounded-none bg-bs-cyan" />
                    </div>
                    <span className="text-xs font-black uppercase text-white/40 tracking-[0.4em]">운영 시스템 대시보드</span>
                 </div>
                 <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-none border border-white/10">
                      <div className="flex items-center gap-4">
                        <Users className="text-bs-cyan" size={20} />
                        <span className="text-sm font-black font-display uppercase tracking-widest">대기중인 참가 승인</span>
                      </div>
                      <span className="px-3 py-1 bg-bs-cyan text-bs-bg text-xs font-black rounded-none italic">12건</span>
                    </div>
                    <div className="flex items-center justify-between bg-bs-red/10 p-6 rounded-none border border-bs-red/20">
                      <div className="flex items-center gap-4">
                        <Zap className="text-bs-red" size={20} />
                        <span className="text-sm font-black font-display uppercase tracking-widest text-bs-red">신고된 분쟁 건</span>
                      </div>
                      <span className="px-3 py-1 bg-bs-red text-white text-xs font-black rounded-none italic animate-pulse">2건</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-32 bg-white/5 rounded-none border-2 border-white/10 border-dashed flex items-center justify-center font-display font-black text-white/20 uppercase tracking-tighter italic">보고서</div>
                      <div className="h-32 bg-white/5 rounded-none border-2 border-white/10 border-dashed flex items-center justify-center font-display font-black text-white/20 uppercase tracking-tighter italic">로그</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-32 relative overflow-hidden bg-white/5 border-4 border-white/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-bs-yellow/5 blur-[120px] rounded-full" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="relative z-10 px-10"
          >
            <h2 className="font-display font-black text-6xl md:text-8xl lg:text-[120px] uppercase leading-[0.85] mb-12 tracking-tighter">
              DO YOU HAVE<br />
              THE <span className="text-outline italic">ARENA</span> SPIRIT?
            </h2>
            <button className="px-16 py-8 bg-bs-yellow text-black rounded-none font-display font-black text-3xl uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95 shadow-[15px_15px_0px_rgba(255,255,255,0.2)] hover:shadow-2xl">
              지금 바로 참가하기
            </button>
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-12 font-display font-black text-white/40 text-[10px] uppercase tracking-[0.4em]">
              <span className="flex items-center gap-3 italic"><Zap size={16} className="text-bs-yellow" /> 가입 즉시 시즌 명예 배지 지급</span>
              <span className="flex items-center gap-3 italic"><Zap size={16} className="text-bs-yellow" /> 만 14세 이상 참가 가능</span>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t-4 border-white/10 py-32 px-10 bg-bs-bg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-24">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-8">
              <span className="font-display font-black text-4xl tracking-tighter uppercase text-bs-yellow leading-none italic">BSK LEAGUE</span>
            </div>
            <p className="text-lg text-white/40 font-bold leading-relaxed uppercase tracking-tight">
              브롤스타즈 아레나는 공식 슈퍼셀 게임 브롤스타즈를 기반으로 한 독자적인 온라인 토너먼트 플랫폼입니다. 
              최고의 게이머를 위한 커뮤니티 공간을 지향합니다.
            </p>
            <div className="mt-8 p-4 bg-white/5 border-l-4 border-bs-cyan">
               <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">고객지원 이메일</div>
               <div className="font-display font-black text-xl text-bs-cyan uppercase italic tracking-tighter">hello@bskleague.com</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
            <div className="space-y-6">
              <h5 className="font-display font-black text-xs uppercase tracking-[0.3em] text-bs-yellow opacity-50">메뉴</h5>
              <ul className="space-y-3 text-sm font-black uppercase tracking-widest text-white/40">
                <li onClick={() => setStaticPage({ title: '대회 가이드', content: '대회 가이드 내용이 여기에 들어갑니다...' })} className="hover:text-bs-yellow transition-colors cursor-pointer">대회 가이드</li>
                <li onClick={() => setStaticPage({ title: '상금 규정', content: '상금 지급 규정 및 절차 안내...' })} className="hover:text-bs-yellow transition-colors cursor-pointer">상금 규정</li>
                <li onClick={() => setStaticPage({ title: '커뮤니티', content: '커뮤니티 이용 수칙 및 안내...' })} className="hover:text-bs-yellow transition-colors cursor-pointer">커뮤니티</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-display font-black text-xs uppercase tracking-[0.3em] text-bs-yellow opacity-50">법률</h5>
              <ul className="space-y-3 text-sm font-black uppercase tracking-widest text-white/40">
                <li onClick={() => setStaticPage({ title: '이용약관', content: '이용약관 전문입니다...' })} className="hover:text-bs-yellow transition-colors cursor-pointer">이용약관</li>
                <li onClick={() => setStaticPage({ title: '개인정보처리방침', content: '개인정보처리방침 안내...' })} className="hover:text-bs-yellow transition-colors cursor-pointer">개인정보처리방침</li>
                <li onClick={() => setStaticPage({ title: '청소년보호정책', content: '청소년 보호를 위한 정책...' })} className="hover:text-white transition-colors cursor-pointer">청소년보호정책</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-display font-black text-xs uppercase tracking-[0.3em] text-bs-yellow opacity-50">소통하기</h5>
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-white/5 border-2 border-white/5 hover:border-bs-yellow transition-all duration-300 flex items-center justify-center cursor-pointer group hover:scale-110">
                  <MessageSquare className="group-hover:text-bs-yellow transition-colors duration-300" size={24} />
                </div>
                <div className="w-14 h-14 bg-white/5 border-2 border-white/5 hover:border-bs-yellow transition-all duration-300 flex items-center justify-center cursor-pointer group hover:scale-110">
                  <Zap className="group-hover:text-bs-yellow transition-colors duration-300" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-32 pt-16 border-t-2 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-start gap-4 relative z-[100]">
            <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">
              © 2026 BRALWSTARS ARENA. 모든 권리 보유.
            </p>
            <button 
              onClick={async () => {
                try {
                  await signInAnonymously(auth);
                  setIsAdminOpen(true);
                } catch (err) {
                  console.error("Auth failed:", err);
                  setIsAdminOpen(true); // Fallback to open anyway as requested
                }
              }}
              className="mt-4 px-8 py-3 bg-bs-yellow text-black border-2 border-bs-yellow text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[5px_5px_0px_white]"
            >
              ADMIN CONSOLE ACCESS
            </button>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase text-white/20 tracking-tighter italic">
            <span>{isAdminOpen ? 'ADMIN AUTHORIZED' : 'GUEST SESSION'}</span>
            <span>브롤스타즈 팬들을 위해 제작됨</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
