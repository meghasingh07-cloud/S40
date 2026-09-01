# FraudShield AI integration — production prototype

## Architecture

Browser → Vite `/api` proxy → Node/Express + JWT → Python FastAPI → Hugging Face.

The prototype intentionally contains **no Gemini dependency or key**.

### Hugging Face models

- Scam/message semantic model: `rehan-ml/scamshield-scam-detector`
- Multilingual call-vector model: `MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`
- Audio transcription: `openai/whisper-large-v3-turbo`

The first model is a 67M-parameter DistilBERT binary scam classifier. The multilingual mDeBERTa model is used as a zero-shot call-vector layer, and Whisper large-v3-turbo is used for recorded call transcription.

## Data

- `AI_BACKEND/data/scam_messages.json`: 1,200 synthetic scam-message examples across multiple scam families.
- `AI_BACKEND/data/fraud_intelligence.json`: 1,200 **synthetic demo** phone/UPI identifiers. These are deliberately non-real test identifiers and must not be presented as an official fraud registry.
- `FRAUD_INTELLIGENCE_FEED_URL` can point to an authorized live intelligence feed returning a JSON array or `{ "results": [...] }`. The remote feed is merged with the local demo corpus.

## Risk pipeline

1. Payment starts → personal account baseline and amount/category analysis.
2. Call Guard automatically receives the current authorized transcript.
3. English + Hinglish rules plus the multilingual Hugging Face call model evaluate social-engineering signals.
4. Beneficiary, device, velocity and account-range context are fused.
5. Strong call/social-engineering evidence cannot be averaged away by a low transaction score.
6. Final score produces `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` and an advisory payment outcome.
7. The UI exposes a **Second thought** check before proceeding on elevated risk.
8. Scam-chain/timeline data is returned by the AI pipeline for visual rendering.

## JWT

All AI analysis endpoints behind Node are protected by JWT. Node-to-Python AI calls additionally use `FRAUDSHIELD_INTERNAL_SECRET` so the Python service is not an unauthenticated internal API.

Never commit `.env` or `AI_BACKEND/.env`.

## Local setup

### Terminal 1 — AI

```bash
cd AI_BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Put the Hugging Face token in AI_BACKEND/.env as HF_TOKEN=hf_...
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Terminal 2 — Node

```bash
npm install
cp .env.example .env
# Set MONGO_URI, JWT_SECRET and the same FRAUDSHIELD_INTERNAL_SECRET used by AI_BACKEND/.env
node server.js
```

### Terminal 3 — frontend

```bash
npm run dev
```

The Vite proxy points `/api` to `http://127.0.0.1:5050` to avoid macOS AirPlay occupying port 5000.

## Important limitation

The 1,200-message and 1,200-identifier corpora are **synthetic test data**. A prototype should never claim that these records are reports from banks, NPCI, police, or a government registry. For a real deployment, connect an authorized and verifiable fraud-intelligence source and retain provenance for every match.
