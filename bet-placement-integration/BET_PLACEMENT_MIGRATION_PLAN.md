# Bet Placement & Calculation Migration Plan (unibet-api → bet-app)

## Scope & Principles
- Migrate ONLY two parts from unibet-api into bet-app:
  1) Single-bet placement (data fields parity with unibet-api)
  2) Bet outcome calculation (FotMob-powered)
- Keep bet-app UI, auth, user/admin dashboards, balance logic, and conflict-prevention intact.
- Phase 1 migrates single-bet placement only. Combination bets remain as-is (deferred).
- Phase 2 migrates outcome calculation. Payout/settlement must continue to work within bet-app’s models.

References:
- bet-app: `bet-placement-integration/BET_APP_BET_PLACEMENT_API_DOCUMENTATION.md`
- unibet-api: `bet-placement-integration/UNIBET_API_BET_PLACEMENT_API_DOCUMENTATION.md`

---

## Phase 0 – Pre‑flight
- Align on payloads and storage:
  - Source (frontend): bet-app `placeBetThunk` (single only for this migration)
  - Target (backend): bet-app `/api/bet/place-bet`
  - Desired stored metadata parity with unibet-api bet document (keep bet-app fields + add missing fields needed for calc/debug)
- Confirm constraints:
  - Keep `authenticateToken`, `preventConflictingBet`, user balance updates, and admin reporting untouched.
  - Ignore combination bets in this phase.

Checklist:
- [ ] Verify existing bet-app endpoints work in a test env
- [ ] Snapshot current `Bet` documents and dashboards (baseline)
- [ ] Confirm which unibet-api fields we must preserve (see Mapping below)

---

## Phase 1 – Single-Bet Placement Migration (Parity with unibet-api)

Goal: When placing a single bet in bet-app, capture all important fields that unibet-api stores while preserving bet-app auth, balance deduction, and conflict checks.

1) API Contract (keep bet-app)
- Continue using bet-app endpoint: `POST /api/bet/place-bet`
- Continue using bet-app middleware: `authenticateToken`, `preventConflictingBet`
- Continue updating user balance and writing `userId` in bet document

2) Data Mapping (bet-app → unibet-api parity)
- Input (bet-app `placeBetThunk`):
  - Required: `matchId`, `oddId`, `stake`, `betOption`, `marketId`
  - Provided: `betDetails` (market_id, market_name, label, value, total, market_description, handicap, name), `inplay`
- Store or derive for parity with unibet-api (where available):
  - eventId ← `matchId`
  - marketId ← `marketId` (string/number → string)
  - outcomeId ← `oddId`
  - odds ← `betDetails.value` (decimal)
  - stake ← `stake`
  - eventName ← from match name if available (bet-app matchData) or keep null
  - marketName ← `betDetails.market_name` or `betDetails.market_description`
  - criterionLabel / criterionEnglishLabel ← from market title if available (optional)
  - participant / participantId / eventParticipantId ← from selected option if available (optional)
  - betOfferTypeId ← not always present (optional)
  - handicapRaw / handicapLine ← map from `betDetails.handicap` (if numeric: store raw/line); else null
  - leagueId / leagueName / homeName / awayName / start ← from bet-app match/league data

3) Model & Persistence
- Keep existing `Bet` schema intact for current flows.
- Add an optional subdocument to preserve unibet-specific metadata (no behavior change):
  - `unibetMeta`: `{ eventName, marketName, criterionLabel, criterionEnglishLabel, outcomeEnglishLabel, participant, participantId, eventParticipantId, betOfferTypeId, handicapRaw, handicapLine, leagueId, leagueName, homeName, awayName, start }`
- Rationale: avoids breaking dashboards while capturing richer metadata for Phase 2.

4) Controller Update (non-breaking)
- Before writing the bet:
  - Build `unibetMeta` from incoming payload and server-side lookup (match, league context already available in bet-app)
  - Continue existing checks: auth user present, conflicting bet prevention, balance >= stake
- After writing the bet:
  - Continue current response shape for frontend (`{ success, bet, user }`)

5) Tests
- Unit: mapping function (input payload → `unibetMeta`)
- Integration: place single bet, verify DB doc includes both existing fields and `unibetMeta`
- Regression: balance deduction and conflict checks unaffected

Release criteria (Phase 1):
- [x] Single-bet placement persists parity fields (`unibetMeta`) without breaking existing UI/flows
- [x] Admin/user dashboards show unchanged data
- [x] Balances and conflict checks behave as before

---

### Phase 1 – Implementation Notes (Completed)
- Added optional `unibetMeta` subdocument to `server/src/models/Bet.js` with fields:
  `eventName, marketName, criterionLabel, criterionEnglishLabel, outcomeEnglishLabel, participant, participantId, eventParticipantId, betOfferTypeId, handicapRaw, handicapLine, leagueId, leagueName, homeName, awayName, start`.
- Added `buildUnibetMetaFromPayload(payload, context)` in `server/src/services/bet.service.js` and persist `unibetMeta` during single-bet creation. No API/response shape changes; existing auth, conflict checks, and balance handling remain intact.
- Updated `server/src/controllers/bet.controller.js` to infer Unibet-like fields (market name, handicap raw/line, participant, league, start) and pass an `unibetMetaPayload` into `BetService.placeBet` for single bets.
- Relaxed legacy SportsMonk-required fields in `server/src/models/Bet.js` (made optional): `matchDate`, `estimatedMatchEnd`, `teams`, `selection` to align with Unibet data.

- Enrichment pipeline:
  - Cache Unibet betoffers for 120s (`unibet_v2_<eventId>`) when `/api/v2/betoffers/:id` is hit.
  - During placement, hydrate `unibetMeta` from cached betoffers: `marketId`, `marketName`, `criterionLabel/english`, `outcomeLabel/english`, `participant/Ids`, `betOfferTypeId`, `handicapRaw/Line`, plus `leagueId/Name`, `homeName/awayName`, `start`.
  - Fallbacks: teams string for names, client `betDetails` for odds if cache missing.

Next steps:
- [x] Manual test: single bet placement, auth, conflict check, balance debit
- [x] Verify `unibetMeta` filled (market/participant/league/start) for cached events
- [x] Unit/integration tests for mapping and enrichment
- [ ] Proceed to Phase 2 (calculator integration)

Session changelog (latest):
- Model updated: `Bet.unibetMeta` (optional parity metadata)
- Service updated: `buildUnibetMetaFromPayload`, `placeBet(..., unibetMetaPayload)`
- Controller updated: builds and forwards `unibetMetaPayload` for single bets

---

## Phase 2 – Outcome Calculation Migration (FotMob-powered) ✅ COMPLETED

Goal: Replace bet-app outcome calculation with unibet-api's calculator (single bets), while keeping bet-app's payout/settlement and dashboards.

### Implementation Summary
- **Calculator Integration**: Copied `bet-outcome-calculator.js` and all utilities to `server/src/unibet-calc/`
- **Schema Adapter**: Built `BetSchemaAdapter` to map bet-app Bet schema to calculator format
- **FotMob Cache Management**: Admin endpoints for cache management and FotMob API integration
- **Processing Endpoints**: Admin-only batch and single bet processing with balance updates

### Files Created/Modified
1) **Calculator Module**: `server/src/unibet-calc/`
   - `bet-outcome-calculator.js` - Main calculator class
   - `utils/fotmob-helpers.js` - FotMob data extraction utilities
   - `utils/market-normalizer.js` - Market normalization utilities
   - `utils/market-registry.js` - Market identification rules
   - `league_mapping_clean.csv` - Unibet ↔ FotMob league mapping

2) **Schema Adapter**: `server/src/services/betSchemaAdapter.service.js`
   - `adaptBetForCalculator()` - Maps bet-app Bet → calculator format
   - `adaptCalculatorResult()` - Maps calculator result → bet-app format
   - `validateBetForCalculator()` - Validates bet compatibility
   - `getMarketFamily()` - Determines market family

3) **FotMob Controller**: `server/src/controllers/fotmob.controller.js`
   - Cache management (clear, refresh, multi-day)
   - Cache analysis and stats
   - Auto-refresh triggers
   - Test endpoints

4) **Processing Controller**: `server/src/controllers/unibetCalc.controller.js`
   - `processAll()` - Batch process pending bets
   - `processOne()` - Process single bet
   - `processWithMatch()` - Process bet with known match ID
   - Balance updates and error handling

5) **Routes**: 
   - `server/src/routes/unibet-api/fotmob.routes.js` - FotMob cache endpoints
   - `server/src/routes/unibet-api/unibet-calc.routes.js` - Processing endpoints

6) **App Integration**: `server/src/app.js`
   - Mounted `/api/v2/fotmob` and `/api/v2/unibet-calc` routes
   - Admin-only authentication required

### API Endpoints
```bash
# FotMob Cache Management (Admin only)
POST /api/v2/fotmob/clear-cache
POST /api/v2/fotmob/refresh-cache/:date?
POST /api/v2/fotmob/refresh-multiday-cache
GET /api/v2/fotmob/cache-content|cache-analysis|cache-stats
POST /api/v2/fotmob/trigger-auto-refresh
GET /api/v2/fotmob/auto-refresh-status
GET /api/v2/fotmob/test-fotmob/:date?

# Bet Processing (Admin only)
POST /api/v2/unibet-calc/process
POST /api/v2/unibet-calc/process/:betId
POST /api/v2/unibet-calc/process/:betId/match/:matchId
GET /api/v2/unibet-calc/status
```

### Schema Mapping
- **outcomeId** ← `Bet.oddId`
- **market fields** ← `Bet.betDetails` + `unibetMeta.marketName/criterionLabel`
- **line/thresholds** ← from `Bet.betDetails.handicap`/`total` via `normalizeLine`
- **participant IDs/names** ← `unibetMeta.participant*` if present
- **match context** ← `unibetMeta` + stored match info

### Benefits
- **Zero schema migration** - Reuses existing bet-app Bet model
- **Admin control** - Secure processing endpoints with authentication
- **Balance safety** - Proper balance updates and error handling
- **Comprehensive results** - Returns processing summary and individual bet results
- **FotMob integration** - Full cache management and API integration
- **Automated processing** - Bet processing runs automatically every 5 minutes
- **Automated cache refresh** - FotMob multi-day cache refreshes every 24 hours

### Automation Features
- **Automated Bet Processing**: Runs every 5 minutes to process pending bets (finished matches only)
- **Automated Cache Refresh**: FotMob multi-day cache refreshes every 24 hours automatically
- **Server Integration**: Both automated processes start when server starts, no manual intervention required
- **Agenda Job Scheduler**: Integrated with existing bet-app job scheduler for reliability

Release criteria (Phase 2):
- [x] Single-bet outcomes calculated by calc, persisted into bet-app model
- [x] Balance adjustments occur exactly once per resolution
- [x] Admin batch endpoints and logs verified
- [x] Automated processing implemented and integrated with Agenda scheduler

---

## Phase 3 – Combination Bets (Deferred)
- Out of scope for initial migration. When revisited:
  - Extend adapter to compute accumulator odds and leg-level statuses
  - Aggregate payout per unibet-api approach (when implemented), or retain bet-app logic
  - Update conflict checks for multi-leg consistency

---

## Rollout & Safety
- Feature flag: enable calculator endpoints behind `CALC_MIGRATION_ENABLED=true`
- Logging: detailed audit for mapping, matching, and outcome (per betId)
- Rate limiting: reuse calculator’s built-in throttling; add server-side limits
- Rollback: retain old calculation route; toggle via flag if needed

---

## Operational Checklist
- [ ] Phase 0 baselines captured
- [x] Phase 1 mapping implemented; `unibetMeta` persisted
- [x] Phase 1 manual verification passed (auth, conflict, balance, enrichment)
- [x] Phase 1 automated tests passed; release
- [x] Phase 2 calculator & utils copied; endpoints guarded (admin only)
- [x] Phase 2 adapter implemented; balances verified
- [x] Phase 2 tests and UAT passed; optional scheduler enabled
- [x] Phase 2 automated processing configured (5-second intervals for testing)
- [x] Phase 2 ready for bet placement testing

---

## Deliverables Summary ✅ COMPLETED
- **Phase 1**: Non-breaking placement edits (single bets), `unibetMeta` subdocument, parity fields stored
- **Phase 2**: New calc module + FotMob cache admin endpoints + processing endpoints + adapter + balance-safe persistence

Notes:
- Keep existing bet-app UX and security (auth/admin) untouched.
- Combination bets postponed until single-bet flow is proven in prod.
