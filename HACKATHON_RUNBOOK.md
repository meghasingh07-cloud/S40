# FraudShield hackathon runbook

## Services

1. AI backend: `AI_BACKEND` on `127.0.0.1:8000`
2. Node backend: project root on `127.0.0.1:5050`
3. Vite frontend: project root on `localhost:5173`

## Environment

Copy `.env.example` to `.env` and set a random `JWT_SECRET`, a random `FRAUDSHIELD_INTERNAL_SECRET`, MongoDB URI, and the server-side `HF_TOKEN`.

Copy `AI_BACKEND/.env.example` to `AI_BACKEND/.env` and set the same internal secret plus `HF_TOKEN`.

Never commit either `.env` file.

## Flow to demonstrate

`Make Payment → Initial behavioural analysis → automatic Call Guard / Multi-Vector NLP → transaction + beneficiary + cross-platform context → final fused score → Second Thought (when elevated) → Proceed or Pending/Cancel`

The Call Guard supports English/Hinglish transcript analysis. The browser microphone can start automatically after the initial payment analysis in the protected payment flow; browser permission is still required.

## Demo data

`npm run seed:demo` creates a local demo account and transaction history. The default demo login is shown by the seed script; change it before any shared deployment.

The bundled 1,200 message examples and 1,200 intelligence identifiers are synthetic test data and are clearly labeled as such.
