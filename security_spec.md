# Firestore Security Specification - BSK ARENA

## Data Invariants
1. **Notice/Alert**: Only admins can write. Public read.
2. **Tournament**: Create/Update only by admins. Public read.
3. **Registration**: 
    - User can create their own registration.
    - User can only update their own registration (and only specific fields before approval).
    - Admins can update any registration (approval, status).
4. **Match**: 
    - **CRITICAL**: ONLY Admins can update results (`winnerId`, `scoreA`, `scoreB`, `status`).
    - Players can read matches.
    - Operator Observation Status is only mutable by Admins.

## The "Dirty Dozen" Payloads (Attacker Strategy)

1. **Self-Promotion**: Authenticated user tries to create a `Tournament` with status `live`.
2. **Registration Hijack**: User A tries to update User B's registration `status` to `approved`.
3. **Match Result Spoof**: User A (in match) tries to update `Match` with `winnerId = UserA_ID`.
4. **Notice Spam**: Non-admin tries to create a `Notice`.
5. **Ghost Field Injection**: User tries to update `Registration` with extra field `isAdmin: true`.
6. **ID Poisoning**: User tries to create `Match` with 2MB string as ID.
7. **Orphaned Registration**: User tries to register for a non-existent `tournamentId`.
8. **Shadow Balance Update**: User tries to set `Registration.paid = true` without actual payment.
9. **Observation Status Spoof**: User tries to set `operatorObservationStatus = 'verified'` to skip admin check.
10. **Terminal State Break**: Attacker tries to change `winnerId` of a `Match` where `status == 'completed'`.
11. **PII Blanket Read**: User tries to list ALL registrations (including emails) without being admin.
12. **Recursive Cost Attack**: User tries to query `Matches` without filtering by `tournamentId` (if list rule allows it).

## Test Runner (Draft)
A comprehensive test suite would verify these denials.

(Proceeding to generate rules...)
