# CLAUDE.md

Verified project context for the S40 / FraudShield repository, captured from a full repo audit on 2026-08-24 on branch `feature/ai-risk-dashboard-payment`. Everything below was confirmed by reading the actual source; nothing here is assumed.

## Architecture

Three independent codebases in one repo, no monorepo tooling:

1. **Node/Express + MongoDB backend** (repo root) — `server.js`, `routes/`, `controllers/`, `services/`, `models/`, `middleware/`. Default port `5000`.
2. **React 19 + Vite frontend** — `src/`. Default port `5173`. Dev server proxies `/api/*` to `http://localhost:5000` (`vite.config.js`).
3. **Python FastAPI risk-analysis engine** — `AI_BACKEND/main.py`. Default port `8000`. Fully standalone process, own venv (`AI_BACKEND/.venv`), own `requirements.txt`.

Request flow for the payment-simulator feature: `PaymentSimulator.jsx` → `contextFusion.js` (window `CustomEvent` pub/sub) → `ContextFusionMonitor.jsx` (mounted once at `App` root) → Node `/api/ai/*` routes (JWT-protected) → `services/fraudShieldAIService.js` → Python `AI_BACKEND` (`http://127.0.0.1:8000`, no auth, stateless).

## Important directories

- `routes/`, `controllers/`, `services/`, `models/`, `middleware/` — Node backend, layered consistently (routes → controllers → services/models).
- `AI_BACKEND/` — standalone Python FastAPI engine. `main.py` is the entire service (no sub-modules).
- `src/components/` — React components for dashboard sub-views (`ContextFusionMonitor`, `FamilyProtection`, `EmergencyCenter`, `Transactions`, `ScamDetection`, `FraudIntelligence`, `ScamChainTimeline`, `PaymentRiskDemo`, `Settings`).
- `src/Dashboard.jsx` — single ~1400-line component; page switching done via boolean `useState` flags, not routes (despite `react-router-dom` being a dependency, it is unused).
- `src/PaymentSimulator.jsx` — the real, AI-backend-integrated payment risk flow.

## Active entry points

- Node: `npm run dev` (nodemon) or `npm start` → `server.js`.
- Frontend: `npm run client` → Vite dev server.
- AI engine: from `AI_BACKEND/`, activate `.venv`, `uvicorn main:app --reload` (or add `--port 8000`).
- No test suite exists anywhere in the repo. `npm run lint` is the only quality script.

## Important routes

Node (`server.js` mounts all under `/api`):
- `POST /api/auth/register`, `POST /api/auth/login` — public, no JWT.
- `POST /api/transactions` — JWT required. Scores via the flat `services/riskEngine.js`, not the AI engine.
- `POST /api/scam/session`, `POST /api/scam/session/:sessionId/event`, `GET /api/scam/session/:sessionId/timeline` — JWT required.
- `POST /api/message/analyze`, `POST /api/url/analyze` — JWT required, **and** require an active `ScamSession` (`sessionId` in body, status `"active"`) — these write `RiskEvent`s and update the session's running score.
- `POST /api/family/request-approval`, `GET /api/family/pending`, `PATCH /api/family/approval/:approvalId` — JWT required, parent/child approval workflow.
- `GET /api/ai/health` — **no JWT** (proxies AI engine health).
- `GET /api/ai/account-analysis`, `POST /api/ai/payment-initial`, `POST /api/ai/payment-analysis`, `POST /api/ai/voice-analysis`, `POST /api/ai/message-analysis` — JWT required (they need `req.user.userId` to pull the user's Mongo transaction history and build the AI account context).

Python `AI_BACKEND/main.py` (called server-to-server by Node, or directly for prototyping):
- `GET /api/health`
- `POST /api/v1/risk/account`, `/payment-initial`, `/payment-pipeline`, `/payment` (alias of pipeline), `/voice`, `/message`
- `POST /api/v1/beneficiary/analyze`

## Authentication rules

- Standard flow: `middleware/authMiddleware.js` — `Bearer` JWT, `jwt.verify(token, process.env.JWT_SECRET)`, sets `req.user = { userId, role, isSupervised }`. Applied per-route (not globally) on every Node route except `/api/auth/*` and `/api/ai/health`.
- It currently has debug `console.log`s (auth header, whether `JWT_SECRET` is set, decoded payload) left in from development. Not a security leak (never logs the secret value), just noisy — not something to silently remove without being asked, since the task explicitly said do not modify authentication.
- Frontend reads the JWT from `localStorage` under **one of four different keys** (`token`, `fraudshield-token`, `authToken`, `accessToken`) — no canonical key. See `getAuthToken()` in both `PaymentSimulator.jsx` and `contextFusion.js`.

### The no-JWT localhost prototype flow — intentional, do not "fix"

`AI_BACKEND/main.py` (the Python FastAPI service) is **deliberately unauthenticated and stateless**:
- No JWT check on any endpoint.
- No dependency on a Mongo `ScamSession` or any other DB state — every endpoint takes the full `account` context (including the transaction list) directly in the POST body and does all analysis in-memory per request.
- It never writes to any database. It is safe and correct to hit repeatedly via curl/Postman on `http://127.0.0.1:8000` with a hand-built JSON payload, without logging in and without creating any session first.
- This is architecturally correct as-is: the Python engine's job is pure computation over a supplied context, not session/user management. **Do not add JWT verification or a `ScamSession` requirement to `AI_BACKEND/main.py`** just because the Node `/api/ai/*` wrapper routes require JWT — those two layers have different, correctly-scoped responsibilities. The Node layer needs JWT because it has to know *which* Mongo user to build context for; the Python layer doesn't, because the caller already supplies that context.

## Risk-analysis architecture

There are **three separate, unreconciled risk-scoring implementations** — know which one a given code path uses before touching it:

1. `services/riskEngine.js` — flat rule-based scorer (new recipient, amount ≥ 10000, link source, supervised+gaming, new device). Used only by `POST /api/transactions` (`controllers/transactionController.js`).
2. `services/messageRiskEngine.js` / `services/urlRiskEngine.js` — keyword-based scorers. Used only by `/api/message/analyze` and `/api/url/analyze`, both of which require an active `ScamSession` and append `RiskEvent`s to it.
3. `AI_BACKEND/main.py` — statistical/behavioral engine (percentiles, median absolute deviation, velocity windows across minute/hour/day/week/month, category/beneficiary/device history, English+Hinglish keyword-rule Call Guard for voice transcripts, optional Gemini-generated natural-language explanation). Bridged into Node via `services/fraudShieldAIService.js`. This is the engine behind the payment-simulator UI.

These are not unified: creating a transaction via `POST /api/transactions` never invokes the AI engine, and the AI engine's payment analysis never creates a `Transaction` or `ScamSession` by itself — the frontend chains the two manually (AI analysis first via `/api/ai/*`, then a separate `POST /api/transactions` call on user confirmation).

## Important implementation decisions

- The AI engine's decisions are advisory only — by design, "production payment authorization remains authoritative" (explicit comments in `ContextFusionMonitor.jsx` and `AI_BACKEND/main.py`). The AI never moves money or writes Mongo state itself.
- `approval_required` computed by the AI pipeline (`final >= 35`) is **not currently wired** to `POST /api/family/request-approval` — the approval workflow exists but nothing in the payment-simulator flow calls it automatically.
- AI-scored payments never attach a `ScamSession`; `Transaction.sessionId` stays null for that path. Only the message/URL analyzers populate scam-session `RiskEvent` timelines.
- `getOrCreateKnownDeviceId()` in `PaymentSimulator.jsx` persists a per-browser device id in `localStorage` specifically so repeat submissions build real device history for the AI engine's "new device" check, rather than faking it.

## Known issues (verified bugs, not yet fixed)

1. **Crash bug**: `App.jsx` renders `<RiskAnalysis onBack={...} />` when `currentPage === "risk-analysis"`, but `RiskAnalysis` is never imported or defined anywhere in `src/`. `Dashboard.jsx`'s `goToRiskAnalysis()` (wired to a live button) calls `onNavigate("risk-analysis")`, which will throw `ReferenceError: RiskAnalysis is not defined` and crash the app.
2. **Orphaned entry point**: `PaymentSimulator.jsx` (the real AI-integrated payment flow) is not reachable from any button in `Dashboard.jsx`. Only `App.jsx`'s `"make-payment"`/`"payment-simulator"` branch points to it, and nothing calls `onNavigate` with those values.
3. **Duplicate implementation**: `src/components/PaymentRiskDemo.jsx` (opened via Dashboard's `openPaymentDemo`/`showPaymentDemo`) is a separate, apparently locally-simulated payment/NLP demo that overlaps with `PaymentSimulator.jsx`'s real backend-integrated version.
4. Auth token read from 4 different possible `localStorage` keys with no single source of truth for where login actually writes it.

## Run / test commands

```bash
# Node backend (port 5000, needs .env: MONGO_URI, JWT_SECRET, PORT, FRAUDSHIELD_AI_URL, FRAUDSHIELD_AI_TIMEOUT_MS)
npm run dev

# Frontend (port 5173, proxies /api to localhost:5000)
npm run client

# Python AI engine (port 8000, needs AI_BACKEND/.env: GEMINI_API_KEY, GEMINI_MODEL, AI_ALLOWED_ORIGINS)
cd AI_BACKEND
# activate .venv, then:
uvicorn main:app --reload --port 8000
```

No automated test suite exists in any of the three parts. `npm run lint` is the only quality-check script defined.

## Development rules to preserve

- Treat existing code as the source of truth; do not rebuild or duplicate working functionality (there are already 3 risk engines and 2 payment-demo components — do not add a 4th/3rd without first checking these).
- Do not add JWT or `ScamSession` requirements to `AI_BACKEND/main.py` — its statelessness and lack of auth are intentional (see "no-JWT localhost prototype flow" above), not an oversight.
- Do not modify `middleware/authMiddleware.js` or the JWT scheme without explicit instruction.
- Do not change Mongoose schemas without explicit instruction.
- Keep the Node `/api/ai/*` JWT requirement separate in reasoning from the Python engine's lack of auth — they serve different purposes and both are correct as-is.
