# FraudShield Security & Reliability Test Report

## Static checks completed

- Python syntax: PASS (`python -m py_compile AI_BACKEND/main.py`)
- Node syntax: PASS for server, auth controller, JWT middleware, AI service and preflight script
- Preflight: PASS
- Scam corpus: 1,200 records; all marked synthetic
- Intelligence corpus: 1,200 records; all marked synthetic
- Hinglish corpus: present
- Secret scan: PASS; no embedded HF/OpenAI-style access token detected
- JWT: HS256 allow-list + issuer + audience validation
- Node → Python: internal shared-secret validation
- CORS: explicit allow-list
- Body/audio limits: enabled
- Authentication and AI route rate limits: enabled
- Security headers: enabled

## Behavioural checks completed

### Benign payment
A payment consistent with a user's historical category, amount and beneficiary profile produced:
- LOW risk
- PAYMENT_ALLOWED

### Social-engineering chain
A payment with bank impersonation, OTP request, account-blocking threat, secrecy pressure, cross-platform context and a suspicious beneficiary produced:
- CRITICAL risk
- PENDING_PAYMENT
- Second Thought intervention

The final score was not allowed to collapse to a low score merely because the transaction itself resembled a normal UPI payment.

## Intelligence source policy

The bundled identifier corpus is synthetic demo data. It is not an official fraud registry.

The application can consume an authorized `FRAUD_INTELLIGENCE_FEED_URL`. It also provides a manual verification link to the I4C National Cyber Crime Reporting Portal suspect repository. The public repository is complaint-derived and is not a certification of guilt; no automated CAPTCHA bypass or scraping is implemented.

## Deployment requirements before real production

- HTTPS everywhere
- Managed/distributed rate limiting
- Secret manager for JWT/HF/internal secrets
- Refresh-token rotation/revocation
- Centralized audit logging and alerting
- MongoDB authentication, TLS and least-privilege credentials
- Dependency vulnerability scanning (`npm audit`, Python dependency scanner)
- Authorized fraud-intelligence provider/API agreement
- Browser and mobile E2E tests for microphone permission, audio upload and payment confirmation
- Independent security review before handling real money or real financial credentials
