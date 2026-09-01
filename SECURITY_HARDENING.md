# FraudShield security hardening

## Prototype controls included

- JWT access tokens are signed with HS256 and verified with an explicit algorithm, issuer and audience.
- AI routes require a valid JWT at the Node layer.
- Node → Python AI calls require `FRAUDSHIELD_INTERNAL_SECRET`.
- Python AI rejects missing or invalid internal credentials.
- Hugging Face tokens are server-side only; never put `HF_TOKEN` in Vite/React variables.
- CORS is restricted to `ALLOWED_ORIGINS` instead of reflecting arbitrary origins.
- Basic security headers are set by the Node server.
- Lightweight in-process rate limiting is applied to authentication and AI routes for the demo.
- Request body and audio payloads have bounded sizes.
- Authentication input is validated and passwords are bcrypt-hashed.
- Demo intelligence is explicitly marked synthetic and must not be represented as an official fraud registry.

## Before public deployment

Use HTTPS, a managed rate limiter, centralized logging/alerting, secret management, refresh-token rotation/revocation, persistent distributed state, dependency vulnerability scanning, and a verified/authorized fraud-intelligence provider. Do not use the synthetic demo identifiers as real-world evidence.
