# FraudShield — Hackathon Production-Prototype Runbook

## Architecture

Browser → Vite proxy → Express/JWT → FastAPI → Hugging Face Inference Providers.

### AI layers

1. **Payment/account risk engine** — deterministic behavioural analysis using the user's own transaction history.
2. **Scam semantic layer** — `rehan-ml/scamshield-scam-detector` for scam-message probability.
3. **Call-vector layer** — `MoritzLaurer/mDeBERTa-v3-base-mnli-xnli` for multilingual social-engineering vectors.
4. **Speech layer** — `openai/whisper-large-v3-turbo` for audio transcription when recorded audio is supplied.
5. **Safety fusion** — strong call/social-engineering/intelligence evidence is prevented from being diluted by a normal-looking payment transaction.

Hugging Face's Inference Providers support text classification, zero-shot classification and automatic speech recognition through the Python/JS clients. See the official documentation before production deployment.

## Unified Protection Intelligence

The UI intentionally has one protection-intelligence experience for:

- suspicious messages;
- phone numbers;
- UPI IDs/beneficiaries;
- model signals;
- prototype intelligence matches.

The included 1,200-message and 1,200-identifier datasets are **synthetic demo records**. They are not NPCI, bank, police, government or telecom reports. `FRAUD_INTELLIGENCE_FEED_URL` is provided for an authorized live feed.

## Payment flow

1. User enters recipient + amount.
2. Node asks the AI service for **initial account/payment analysis**.
3. Call Guard starts automatically when step 2 opens.
4. Live speech recognition provides immediate transcript text in supported browsers.
5. The transcript is continuously fused with the multilingual call model and scam model.
6. Beneficiary, amount deviation, category baseline, device, velocity, timing and intelligence context are evaluated.
7. Cross-platform context can combine message → call → payment evidence.
8. Final score is produced from the complete context.
9. Elevated risk exposes **Second Thought** questions.
10. User decides whether to proceed or keep the payment pending.

## Terminal setup

### Terminal 1 — AI service

```bash
cd AI_BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Put your Hugging Face token in AI_BACKEND/.env
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Terminal 2 — Node/JWT API

```bash
cp .env.example .env
# Generate secrets:
openssl rand -hex 32
# Put one value in JWT_SECRET and another in FRAUDSHIELD_INTERNAL_SECRET.
# Put the same internal secret in AI_BACKEND/.env.
npm install
node server.js
```

The included Vite configuration uses port **5050**, avoiding macOS AirPlay/AirTunes conflicts with port 5000.

### MongoDB is optional for the demo

The corrected build starts even if MongoDB is unavailable. In that case the demo account and a small synthetic in-memory ledger are used. This prevents a database outage from making the website unusable.

For persistent storage, start MongoDB and then run:



```bash
npm run seed:demo
```

Demo login:

```text
Email: demo@fraudshield.local
Password: Demo@12345
```

Change these credentials before any public deployment.

### Terminal 3 — frontend

```bash
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

## Fast verification

AI health:

```bash
curl http://127.0.0.1:8000/api/health
```

Node health:

```bash
curl http://127.0.0.1:5050/api/ai/health
```

A successful AI health response should show Hugging Face configured and Gemini disabled/not required.

## Security notes

- Never commit `.env` or Hugging Face tokens.
- Keep the Hugging Face token on the server only; never expose it in React.
- Node AI routes require JWT authentication.
- Node → FastAPI uses `FRAUDSHIELD_INTERNAL_SECRET`.
- For a real deployment, use HTTPS, a managed secrets store, strict CORS, rate limiting, structured audit logging and a verified fraud-intelligence provider.
- JWT validation should verify signature and expiration; production deployments should also use explicit issuer/audience claims and a revocation strategy.

## Important product disclaimer

FraudShield is a decision-support prototype. A model score is not proof that a person, phone number, UPI ID or beneficiary is fraudulent. A no-match is not proof of safety. The UI therefore recommends independent verification rather than presenting AI output as a bank/government verdict.

## Real intelligence integration

FraudShield does not pretend that synthetic demo identifiers are real fraud reports. Configure `FRAUD_INTELLIGENCE_FEED_URL` only with a provider/feed you are authorized to access. The UI also links users to the I4C National Cyber Crime Reporting Portal suspect repository for manual verification.
