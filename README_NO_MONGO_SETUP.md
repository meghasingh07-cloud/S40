# FraudShield — no MongoDB setup

FraudShield now runs with a local JSON database. MongoDB is not required and the server never attempts a MongoDB connection.

## One-time setup

### Node

```bash
npm install
cp .env.example .env
```

Keep the defaults in `.env` for local demo mode. You may change `JWT_SECRET` to a random secret.

### AI

```bash
cd AI_BACKEND
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Put your real Hugging Face token in `AI_BACKEND/.env` as `HF_TOKEN=hf_...`. Never put it in React or commit it.

Hugging Face's current `InferenceClient` accepts the token through the `token` argument and supports automatic provider routing; this build uses that interface.

## Run

Terminal 1:

```bash
cd AI_BACKEND
source .venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```bash
npm run dev
```

Terminal 3:

```bash
npm run client
```

Open `http://localhost:5173`.

## Demo login

Email: `demo@fraudshield.local`
Password: `Demo@12345`

## Database

The local database is stored at `.fraudshield-data/database.json`. It contains demo users, transaction history, approvals and risk/session data. Passwords are bcrypt-hashed. JWTs are signed server-side with `JWT_SECRET`.

## AI payment flow

Make Payment starts:

1. Account + payment history analysis → Score #1
2. Automatic Call Guard → Score #2
3. Cross-platform context fusion (message → call → UPI)
4. Final risk score
5. Second Thought for elevated risk
6. Scam timeline and recommendations
7. Deny/Cancel or Approve
8. Elevated-risk approvals become Pending Payments; normal approved payments become Completed

No manual Multi-Vector Call NLP dashboard is required.
