# FraudShield — corrected all-in-one demo setup

## What was fixed

- MongoDB is now **non-blocking** for local demos. If MongoDB is unavailable, the Node API stays online and uses a clearly labelled in-memory demo account/ledger.
- JWT authentication remains enabled. The demo account is available without MongoDB.
- The staged payment flow is now robust: **Initial Analysis → Multi-Vector Call NLP / Call Guard → Transaction Context → Final Risk → Second Thought → Approve/Reject → Payment History**.
- Fixed the Call Guard finalization bug caused by the finalizer being out of scope for the microphone controls.
- Added a browser/webview fallback demo call so the flow does not get stuck when SpeechRecognition is unavailable.
- Added cross-platform context demo: **WhatsApp refund message → phone call → UPI payment**.
- Added a scam-chain timeline and immediate safety guidance.
- Hugging Face models are kept server-side:
  - `rehan-ml/scamshield-scam-detector`
  - `MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`
  - `openai/whisper-large-v3-turbo`
- The deterministic rule engine remains a safety fallback if the Hugging Face token/provider is temporarily unavailable.

## Run

### 1. Node/JWT API

```bash
cp .env.example .env
npm install
node server.js
```

Node listens on `http://127.0.0.1:5050`.

### 2. AI backend

In another terminal:

```bash
cd AI_BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Put your real Hugging Face token in `AI_BACKEND/.env`:

```text
HF_TOKEN=hf_...
```

Then:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The AI service listens on `http://127.0.0.1:8000`.

### 3. Frontend

In another terminal:

```bash
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Demo login

```text
Email: demo@fraudshield.local
Password: Demo@12345
```

If MongoDB is running, the normal MongoDB-backed account/transaction path is used. If MongoDB is down, the demo account and local demo ledger keep the prototype usable.

## Recommended hackathon test

1. Sign in with the demo account.
2. Open **Make a Payment**.
3. Keep **New Beneficiary** and **Unknown Device** enabled.
4. Keep **Cross-platform context** enabled.
5. Use an amount such as `25000`.
6. Click **Analyze Payment**.
7. Step 1 builds the behavioural baseline.
8. Step 2 starts Call Guard automatically.
9. If the browser supports microphone speech recognition, speak normally.
10. If the browser does not support it, FraudShield uses the clearly labelled demo Call Guard fallback.
11. The final score combines behavioural, transaction, beneficiary, temporal, call/NLP and cross-platform evidence.
12. For elevated risk, use **Second Thought** to answer the three verification questions.
13. Choose **Cancel Payment** or **Send to Pending / Approval**.
14. If you continue, explicitly confirm the transaction in the payment page. The AI never moves money itself.

## Model/API notes

The Hugging Face token is never sent to React. The browser calls the authenticated Node API; Node calls the FastAPI AI service with the internal service secret.

Whisper is used when recorded call audio is submitted through the transcription route. Browser speech recognition provides immediate live transcript feedback; the final NLP fusion uses the transcript plus the scam classifier and multilingual call classifier.

Without `HF_TOKEN`, the system still runs using deterministic safety rules so the UI does not become unusable. The AI health endpoint clearly reports whether Hugging Face is configured.

## MongoDB

MongoDB is optional for the local hackathon demo and required for persistent production storage.

To use MongoDB, set:

```text
MONGO_URI=mongodb://127.0.0.1:27017/fraudshield
```

The server uses a short connection timeout and starts even when MongoDB cannot be reached, instead of leaving the website completely unavailable.

## Security

For a real deployment:

- replace all development secrets;
- use HTTPS;
- use a managed MongoDB deployment;
- use a secrets manager;
- restrict CORS to the deployed frontend;
- add durable audit logging;
- add JWT revocation/rotation;
- use an authorized fraud-intelligence feed;
- do not treat an AI score as proof of fraud.

