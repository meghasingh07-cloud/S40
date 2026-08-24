from __future__ import annotations

import os
import statistics
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from google import genai
except Exception:  # pragma: no cover
    genai = None

load_dotenv()

app = FastAPI(title="FraudShield AI Engine", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            text = str(value).replace("Z", "+00:00")
            dt = datetime.fromisoformat(text)
        except Exception:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def normalize_transactions(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    now = now_utc()
    out: list[dict[str, Any]] = []
    for row in rows:
        created = parse_dt(row.get("timestamp") or row.get("createdAt") or row.get("created_at"))
        hours = row.get("hours_ago")
        if hours is None and created:
            hours = max(0.0, (now - created).total_seconds() / 3600)
        try:
            amount = float(row.get("amount", 0))
        except Exception:
            amount = 0.0
        out.append({
            "id": str(row.get("id") or row.get("_id") or ""),
            "timestamp": created.isoformat() if created else None,
            "hours_ago": float(hours or 0),
            "amount": amount,
            "category": str(row.get("category") or "other").lower(),
            "merchant": str(row.get("merchant") or row.get("recipientName") or "unknown"),
            "beneficiary": str(row.get("beneficiary") or row.get("recipientUPI") or row.get("recipientName") or "unknown"),
            "device": str(row.get("device") or row.get("deviceId") or "unknown"),
            "channel": str(row.get("channel") or row.get("type") or "unknown"),
            "status": str(row.get("status") or "completed").lower(),
        })
    return sorted(out, key=lambda x: x.get("hours_ago", 10**9))


class TransactionRow(BaseModel):
    id: str | None = None
    timestamp: str | None = None
    createdAt: str | None = None
    created_at: str | None = None
    hours_ago: float | None = None
    amount: float = 0
    category: str = "other"
    merchant: str | None = None
    recipientName: str | None = None
    beneficiary: str | None = None
    recipientUPI: str | None = None
    device: str | None = None
    deviceId: str | None = None
    channel: str | None = None
    type: str | None = None
    status: str | None = None


class AccountContext(BaseModel):
    account_id: str = "production-user"
    transactions: list[TransactionRow] = Field(default_factory=list)
    normal_hours: list[int] = Field(default_factory=lambda: [8, 23])
    supervised: bool = False
    spending_limit: float | None = None


class PaymentRequest(BaseModel):
    account: AccountContext
    amount: float = Field(gt=0)
    category: str = "other"
    beneficiary_id: str | None = None
    device_id: str | None = None
    channel: str = "UPI"
    call_transcript: str = ""
    call_language: str = "en-IN"
    call_active: bool = False


class VoiceRequest(BaseModel):
    transcript: str = ""
    language: str = "en-IN"


class MessageRequest(BaseModel):
    text: str


class BeneficiaryRequest(BaseModel):
    beneficiary_id: str
    historical_count: int = 0
    is_new: bool = True


def clamp(v: float) -> int:
    return max(0, min(100, int(round(v))))


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    values = sorted(values)
    if len(values) == 1:
        return values[0]
    pos = (len(values) - 1) * p
    lo = int(pos)
    hi = min(lo + 1, len(values) - 1)
    return values[lo] + (values[hi] - values[lo]) * (pos - lo)


def median_abs_dev(values: list[float]) -> float:
    if not values:
        return 1.0
    med = statistics.median(values)
    return statistics.median(abs(v - med) for v in values) or 1.0


def level(score: int) -> str:
    if score >= 85:
        return "CRITICAL"
    if score >= 65:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    return "LOW"


def action(score: int) -> str:
    if score >= 85:
        return "HOLD_AND_VERIFY"
    if score >= 65:
        return "WARN_USER"
    if score >= 35:
        return "VERIFY"
    return "MONITOR"


def gemini_explanation(context: str) -> str | None:
    key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not key or genai is None:
        return None
    try:
        client = genai.Client(api_key=key)
        prompt = (
            "You are FraudShield AI, an advisory fraud-risk reasoning layer. "
            "Do not authorize, reject, or settle money. Explain only evidence present in the supplied context. "
            "Do not invent transaction history, beneficiaries, devices, or facts. "
            "Be concise and suitable for a security UI.\n\n" + context
        )
        response = client.models.generate_content(model=model, contents=prompt)
        text = getattr(response, "text", None)
        return text.strip() if text else None
    except Exception:
        return None


def account_profile(account: AccountContext) -> dict[str, Any]:
    rows = normalize_transactions([r.model_dump() for r in account.transactions])
    spend_rows = [r for r in rows if r["amount"] > 0 and r["status"] not in {"cancelled", "rejected", "pending"}]
    amounts = [r["amount"] for r in spend_rows]
    category_profile: list[dict[str, Any]] = []
    category_totals: dict[str, float] = {}
    category_rows: dict[str, list[float]] = {}
    beneficiary_counts: dict[str, int] = {}
    device_counts: dict[str, int] = {}
    for r in spend_rows:
        c = r["category"]
        category_totals[c] = category_totals.get(c, 0) + r["amount"]
        category_rows.setdefault(c, []).append(r["amount"])
        b = r["beneficiary"]
        beneficiary_counts[b] = beneficiary_counts.get(b, 0) + 1
        d = r["device"]
        device_counts[d] = device_counts.get(d, 0) + 1
    total_spend = sum(category_totals.values()) or 1
    for c, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        vals = category_rows[c]
        category_profile.append({
            "category": c,
            "transactions": len(vals),
            "spend": round(total),
            "share": round(total / total_spend * 100, 1),
            "median_amount": round(statistics.median(vals)),
            "p25": round(percentile(vals, .25)),
            "p75": round(percentile(vals, .75)),
        })
    hours = []
    for r in spend_rows:
        dt = parse_dt(r.get("timestamp"))
        if dt:
            hours.append(dt.hour)
    normal_hours = account.normal_hours
    if hours:
        normal_hours = [max(0, min(hours)), min(23, max(hours))]
    return {
        "rows": rows,
        "spend_rows": spend_rows,
        "amounts": amounts,
        "category_profile": category_profile,
        "beneficiary_counts": beneficiary_counts,
        "device_counts": device_counts,
        "normal_hours": normal_hours,
        "total_spend": sum(amounts),
    }


def behavioral_analysis(profile: dict[str, Any], amount: float, category: str, beneficiary_id: str | None, device_id: str | None):
    rows = profile["spend_rows"]
    amounts = profile["amounts"]
    category = category.lower().strip()
    cat_rows = [r for r in rows if r["category"] == category]
    vals = [r["amount"] for r in cat_rows]
    signals: list[dict[str, Any]] = []
    score = 0.0
    median = statistics.median(vals) if vals else 0
    p25 = percentile(vals, .25) if vals else 0
    p75 = percentile(vals, .75) if vals else 0
    mad = median_abs_dev(vals) if vals else 1
    account_median = statistics.median(amounts) if amounts else 0

    last_min = [r for r in rows if r["hours_ago"] <= 1/60]
    last_hour = [r for r in rows if r["hours_ago"] <= 1]
    last_day = [r for r in rows if r["hours_ago"] <= 24]
    last_week = [r for r in rows if r["hours_ago"] <= 168]
    last_month = [r for r in rows if r["hours_ago"] <= 720]

    if vals:
        ratio = amount / max(median, 1)
        robust = abs(amount - median) / (1.4826 * mad)
        # Relative behavior is the primary signal. A new amount inside a broad
        # personal range remains low/medium rather than automatically becoming high.
        if amount <= max(p75 * 1.25, median * 1.60):
            amount_score = 2
        elif amount <= median * 2.2:
            amount_score = 15
            signals.append({"code": "AMOUNT_ABOVE_BASELINE", "title": "Amount is above the usual category range", "detail": f"₹{amount:,.0f} is above the historical {category} range but remains near the user's observed behavior.", "severity": "LOW"})
        else:
            amount_score = min(48, 18 + max(0, ratio - 2.2) * 10 + max(0, robust - 2) * 4)
            signals.append({"code": "AMOUNT_DEVIATION", "title": "Amount materially differs from category behavior", "detail": f"₹{amount:,.0f} is about {ratio:.1f}× the user's historical {category} median.", "severity": "HIGH" if amount_score >= 35 else "MEDIUM"})
        score += amount_score
    else:
        # Novel category is not high risk by itself. Compare against account-wide behavior.
        account_p75 = percentile(amounts, .75) if amounts else 0
        amount_score = 7 if account_p75 and amount <= account_p75 * 1.5 else 16
        score += amount_score
        signals.append({"code": "CATEGORY_NOVELTY", "title": "New category detected", "detail": f"No historical {category} payments were found; account-wide spending history was used instead of a fixed fraud threshold.", "severity": "LOW" if amount_score < 12 else "MEDIUM"})

    # Familiar category and repeated beneficiary materially reduce false positives.
    if len(cat_rows) >= 4:
        score -= 6
    if beneficiary_id:
        count = profile["beneficiary_counts"].get(beneficiary_id, 0)
        if count == 0:
            score += 10
            signals.append({"code": "NEW_BENEFICIARY", "title": "First payment to this beneficiary", "detail": "No completed historical payment to this beneficiary was found in the user's ledger.", "severity": "MEDIUM"})
        elif count >= 3:
            score -= 7

    if device_id:
        count = profile["device_counts"].get(device_id, 0)
        if count == 0:
            score += 8
            signals.append({"code": "NEW_DEVICE", "title": "Device is not in the observed history", "detail": "A new device adds context but is not treated as fraud by itself.", "severity": "LOW"})
        elif count >= 5:
            score -= 4

    if len(last_min) >= 2:
        score += 28
        signals.append({"code": "MINUTE_VELOCITY", "title": "Multiple payments in the last minute", "detail": f"{len(last_min)} payments were observed in the last minute.", "severity": "HIGH"})
    elif len(last_hour) >= 5:
        score += 22
        signals.append({"code": "HOURLY_VELOCITY", "title": "Unusually dense recent activity", "detail": f"{len(last_hour)} payments were observed in the last hour.", "severity": "HIGH"})
    elif len(last_day) >= 10:
        score += 12
        signals.append({"code": "DAILY_VELOCITY", "title": "Higher-than-usual daily activity", "detail": f"{len(last_day)} payments were observed in the last 24 hours.", "severity": "MEDIUM"})

    current_hour = now_utc().hour
    start, end = profile["normal_hours"]
    if not (start <= current_hour <= end):
        score += 6
        signals.append({"code": "UNUSUAL_HOUR", "title": "Payment is outside the user's usual hours", "detail": f"The observed profile is normally active around {start}:00–{end}:00.", "severity": "LOW"})

    return clamp(score), signals, {
        "category_median": round(median),
        "category_p25": round(p25),
        "category_p75": round(p75),
        "category_transactions": len(vals),
        "account_median": round(account_median),
        "profile_sample_size": len(rows),
        "last_minute_count": len(last_min),
        "last_hour_count": len(last_hour),
        "last_24h_count": len(last_day),
        "last_7d_count": len(last_week),
        "last_30d_count": len(last_month),
        "last_24h_spend": round(sum(r["amount"] for r in last_day)),
        "last_7d_spend": round(sum(r["amount"] for r in last_week)),
        "last_30d_spend": round(sum(r["amount"] for r in last_month)),
        "normal_hours": [start, end],
    }


def temporal_analysis(profile: dict[str, Any], category: str | None = None):
    rows = profile["spend_rows"]
    windows = {"last_minute": 1/60, "last_hour": 1, "last_day": 24, "last_week": 168, "last_month": 720}
    out: dict[str, Any] = {}
    max_risk = 0
    for name, hours in windows.items():
        selected = [r for r in rows if r["hours_ago"] <= hours]
        if category:
            selected = [r for r in selected if r["category"] == category.lower()]
        total = sum(r["amount"] for r in selected)
        risk = 0
        if name == "last_minute" and len(selected) >= 2: risk = 45
        elif name == "last_hour" and len(selected) >= 5: risk = 35
        elif name == "last_day" and len(selected) >= 10: risk = 28
        elif name == "last_week" and len(selected) >= 25: risk = 20
        elif name == "last_month" and total >= 150000: risk = 18
        max_risk = max(max_risk, risk)
        out[name] = {"count": len(selected), "total": round(total), "risk": risk}
    return max_risk, out


def local_voice_analysis(text: str, language: str = "en-IN") -> dict[str, Any]:
    """Deterministic Call Guard for English + Hinglish/transliterated Hindi.

    It is intentionally conservative: a single unusual phrase does not automatically
    become critical. Multiple independent social-engineering indicators are required
    for escalation.
    """
    t = " ".join(str(text or "").lower().split())
    # English and common Hinglish / Roman-Hindi phrases heard in fraud calls.
    rules = [
        ("credential_extraction", [
            "otp", "one time password", "one-time password", "upi pin", "pin batao",
            "pin bataye", "pin bataiye", "otp batao", "otp bataye", "otp batayiye",
            "cvv", "password", "verification code", "code batao", "code bataye",
            "code share", "otp share", "pin share", "details batao", "bank details"
        ], 38, "Credential extraction request"),
        ("impersonation", [
            "bank", "rbi", "reserve bank", "police", "cyber", "cyber crime",
            "fraud department", "officer", "bank se bol raha", "bank se bol rahi",
            "bank se call", "rbi se", "police se", "cyber cell se", "customer care se"
        ], 16, "Institution impersonation language"),
        ("urgency", [
            "immediately", "right now", "urgent", "hurry", "quickly", "block", "blocked",
            "expire", "abhi", "turant", "jaldi", "fatafat", "abhi ke abhi",
            "account band", "account bandh", "account block ho jayega", "aaj hi"
        ], 18, "Artificial urgency"),
        ("payment_pressure", [
            "transfer", "send money", "pay", "upi", "paise bhejo", "paise transfer",
            "payment karo", "payment kar do", "money transfer", "secure account",
            "safe account", "account mein bhejo", "is account mein", "upi karo"
        ], 20, "Payment pressure"),
        ("threat", [
            "arrest", "case", "legal action", "penalty", "account will be blocked",
            "jail", "giraftar", "police case", "case ho jayega", "jail bhej",
            "legal action hoga", "fine lagega", "account band kar denge"
        ], 20, "Threat or fear manipulation"),
        ("remote_access", [
            "anydesk", "teamviewer", "screen share", "remote access", "install this app",
            "app install karo", "screen share karo", "remote app", "access do", "control do"
        ], 28, "Remote-access request"),
    ]
    signals = []
    score = 0
    for code, words, weight, title in rules:
        if any(word in t for word in words):
            score += weight
            signals.append({
                "code": code.upper(),
                "title": title,
                "detail": f"Detected {title.lower()} in {language or 'en-IN'} call context.",
                "severity": "HIGH" if weight >= 28 else "MEDIUM"
            })
    # Strong combinations are much more meaningful than isolated phrases.
    codes = {s["code"] for s in signals}
    if {"CREDENTIAL_EXTRACTION", "PAYMENT_PRESSURE"}.issubset(codes):
        score += 18
        signals.append({"code": "CREDENTIAL_PAYMENT_COMBINATION", "title": "Credential request combined with payment pressure", "detail": "The call combines a request for sensitive credentials with a payment instruction.", "severity": "HIGH"})
    if {"IMPERSONATION", "URGENCY"}.issubset(codes):
        score += 10
        signals.append({"code": "AUTHORITY_URGENCY_COMBINATION", "title": "Authority impersonation combined with urgency", "detail": "The caller uses institutional authority together with time pressure.", "severity": "HIGH"})
    score = clamp(score)
    return {"risk_score": score, "risk_level": level(score), "recommended_action": action(score), "signals": signals, "language": language or "en-IN", "guard_status": "ACTIVE"}

def combine(behavioral: int, transaction: int, network: int, temporal: int, call: int) -> int:
    # Personal behaviour is primary. Call Guard and independent context can escalate.
    score = 0.55 * behavioral + 0.10 * transaction + 0.12 * network + 0.08 * temporal + 0.15 * call
    if call >= 85:
        score = max(score, call)
    if network >= 85:
        score = max(score, network)
    if behavioral >= 75:
        score = max(score, behavioral)
    return clamp(score)


def initial_payment_analysis(req: PaymentRequest) -> dict[str, Any]:
    """Stage 1: run immediately after amount/category/beneficiary are entered."""
    profile = account_profile(req.account)
    behavioral, b_signals, dimensions = behavioral_analysis(profile, req.amount, req.category, req.beneficiary_id or "", req.device_id)
    transaction = 0
    t_signals: list[dict[str, Any]] = []
    if profile["amounts"]:
        p75 = percentile(profile["amounts"], .75)
        if req.amount > p75 * 3:
            transaction = 25
            t_signals.append({"code": "LARGE_RELATIVE_AMOUNT", "title": "Amount is well above the account's upper range", "detail": f"₹{req.amount:,.0f} is materially above the observed account-wide upper range.", "severity": "MEDIUM"})
        elif req.amount > p75 * 1.75:
            transaction = 10
            t_signals.append({"code": "ABOVE_ACCOUNT_RANGE", "title": "Amount is above the account's usual range", "detail": "The amount is unusual for the account but is not treated as fraud by itself.", "severity": "LOW"})
    else:
        transaction = 5
    if req.account.spending_limit and req.amount > req.account.spending_limit:
        transaction = min(30, transaction + 8)
        t_signals.append({"code": "SPENDING_LIMIT_CONTEXT", "title": "Above configured spending limit", "detail": f"₹{req.amount:,.0f} is above the configured ₹{req.account.spending_limit:,.0f} limit.", "severity": "MEDIUM"})
    preliminary = clamp(0.72 * behavioral + 0.28 * transaction)
    return {
        "stage": "INITIAL_ANALYSIS",
        "status": "COMPLETED",
        "risk_score": preliminary,
        "risk_level": level(preliminary),
        "recommended_action": action(preliminary),
        "amount": req.amount,
        "category": req.category,
        "behavioral": {"risk_score": behavioral, "signals": b_signals, "dimensions": dimensions},
        "transaction_context": {"risk_score": transaction, "signals": t_signals},
        "profile": profile_view(profile),
        "category_profile": profile["category_profile"],
        "recent_history": profile["spend_rows"][:8],
        "message": "Initial personal-behaviour analysis completed before Call NLP and final risk fusion.",
    }


def pipeline(req: PaymentRequest, initial: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = account_profile(req.account)
    rows = profile["spend_rows"]
    initial = initial or initial_payment_analysis(req)

    # Stage 1 is explicitly preserved in the final response so the UI can show it.
    behavioral = int(initial["behavioral"]["risk_score"])
    b_signals = initial["behavioral"]["signals"]
    dimensions = initial["behavioral"]["dimensions"]
    transaction = int(initial["transaction_context"]["risk_score"])
    t_signals = initial["transaction_context"]["signals"]

    # Stage 2: Multi-Vector Call NLP / Call Guard. English + Hinglish are accepted.
    call = local_voice_analysis(req.call_transcript, req.call_language) if req.call_transcript.strip() else {
        "risk_score": 0, "risk_level": "NONE", "recommended_action": "NO_CALL_CONTEXT", "signals": [], "language": req.call_language, "guard_status": "ACTIVE"
    }
    call_status = "ANALYZED" if req.call_transcript.strip() else "READY_NO_TRANSCRIPT"

    # Stage 3: beneficiary/network + temporal transaction context.
    beneficiary = req.beneficiary_id or ""
    beneficiary_count = profile["beneficiary_counts"].get(beneficiary, 0) if beneficiary else 0
    network = 0 if beneficiary_count >= 3 else 12 if beneficiary_count == 0 else 3
    n_signals = []
    if beneficiary and beneficiary_count == 0:
        n_signals.append({"code": "NEW_BENEFICIARY", "title": "New beneficiary context", "detail": "This recipient has not appeared in the user's completed transaction history.", "severity": "MEDIUM"})
    temporal, windows = temporal_analysis(profile, req.category)

    # Stage 4: final fusion. A new category/beneficiary alone does not become high risk.
    final = combine(behavioral, transaction, network, temporal, call["risk_score"])
    signals = b_signals + t_signals + n_signals + [{**s, "source": "multi_vector_call_nlp"} for s in call.get("signals", [])]

    if call["risk_score"] >= 85:
        reason = "Call Guard found strong social-engineering indicators in the authorized call context."
    elif behavioral >= 65:
        reason = "The payment materially deviates from the user's observed spending behaviour."
    elif network >= 70:
        reason = "The beneficiary context requires additional verification."
    elif final >= 35:
        reason = "The payment differs from the user's normal pattern and should be verified."
    else:
        reason = "The payment is broadly consistent with the user's observed behaviour and no strong independent fraud signal was found."

    # Production decision is advisory only. The existing payment backend remains authoritative.
    payment_outcome = "PENDING_PAYMENT" if final >= 35 else "PAYMENT_ALLOWED"
    approval_required = final >= 35
    gemini = gemini_explanation(
        f"FraudShield staged payment review. Stage1 initial={initial['risk_score']}; behavioral={behavioral}; transaction={transaction}; "
        f"call_nlp={call['risk_score']}; network={network}; temporal={temporal}; final={final}; language={req.call_language}; "
        f"history={len(rows)} rows. Do not invent facts."
    )

    chain = [
        {"type": "INITIAL_ANALYSIS", "title": "Initial behavioural analysis", "risk": initial["risk_score"], "status": "COMPLETED"},
        {"type": "CALL_NLP", "title": "Multi-Vector Call NLP / Call Guard", "risk": call["risk_score"], "status": call_status, "language": req.call_language},
        {"type": "TRANSACTION_CONTEXT", "title": "Transaction + beneficiary + activity context", "risk": max(transaction, network, temporal), "status": "COMPLETED"},
        {"type": "FINAL", "title": "Final FraudShield AI overview", "risk": final, "status": "COMPLETED"},
        {"type": "DECISION", "title": "Payment outcome", "risk": final, "status": payment_outcome},
    ]
    return {
        "risk_score": final,
        "risk_level": level(final),
        "recommended_action": action(final),
        "payment_outcome": payment_outcome,
        "approval_required": approval_required,
        "reason": reason,
        "gemini_explanation": gemini,
        "dimensions": {"initial_analysis": initial["risk_score"], "behavioral_risk": behavioral, "transaction_risk": transaction, "network_risk": network, "temporal_risk": temporal, "call_nlp_risk": call["risk_score"]},
        "windows": windows,
        "signals": signals,
        "call_guard": call,
        "pipeline": {
            "initial_analysis": {"status": "COMPLETED", "risk_score": initial["risk_score"], "signals": b_signals + t_signals},
            "multi_vector_call_nlp": {"status": call_status, "risk_score": call["risk_score"], "language": req.call_language, "signals": call.get("signals", []), "call_guard": call},
            "transaction_context": {"status": "COMPLETED", "risk_score": max(transaction, network, temporal), "transaction_risk": transaction, "beneficiary_risk": network, "temporal_risk": temporal, "windows": windows, "signals": t_signals + n_signals},
            "beneficiary_network": {"status": "COMPLETED", "risk_score": network, "signals": n_signals},
            "temporal_activity": {"status": "COMPLETED", "risk_score": temporal, "windows": windows},
            "final_risk": {"status": "COMPLETED", "risk_score": final, "risk_level": level(final), "reason": reason},
            "payment_decision": {"status": payment_outcome, "approval_required": approval_required},
        },
        "profile": profile_view(profile),
        "category_profile": profile["category_profile"],
        "recent_history": profile["spend_rows"][:8],
        "scam_chain": chain,
    }

def profile_view(profile: dict[str, Any]) -> dict[str, Any]:
    amounts = profile["amounts"]
    p25 = percentile(amounts, .25) if amounts else 0
    p75 = percentile(amounts, .75) if amounts else 0
    return {
        "transaction_count": len(profile["spend_rows"]),
        "median_amount": round(statistics.median(amounts)) if amounts else 0,
        "average_amount": round(statistics.mean(amounts)) if amounts else 0,
        "typical_range": {"low": round(p25), "high": round(p75)},
        "largest_amount": round(max(amounts)) if amounts else 0,
        "smallest_amount": round(min(amounts)) if amounts else 0,
        "category_count": len(profile["category_profile"]),
        "normal_hours": profile["normal_hours"],
        "database_sample": len(profile["rows"]),
        "total_spend": round(profile["total_spend"]),
        "behavioral_rule": "Payments are compared with the user's own history, category range, beneficiary history, device history and recent velocity before escalation.",
    }


@app.get("/api/health")
def health():
    return {"ok": True, "gemini_configured": bool(os.getenv("GEMINI_API_KEY")), "database": "PRODUCTION_CONTEXT_PAYLOAD"}


@app.post("/api/v1/risk/account")
def account_risk(account: AccountContext):
    profile = account_profile(account)
    temporal, windows = temporal_analysis(profile)
    amounts = profile["amounts"]
    score = clamp(min(35, temporal * 0.55))
    signals = []
    if temporal >= 20:
        signals.append({"code": "RECENT_ACTIVITY", "title": "Recent transaction activity is unusually dense", "detail": "The account baseline found elevated velocity in one or more time windows.", "severity": "MEDIUM"})
    return {
        "risk_score": score,
        "risk_level": level(score),
        "title": "Live account risk overview",
        "reason": "FraudShield AI examined the supplied transaction ledger across minute, hour, day, week and month windows and built a personal spending baseline.",
        "signals": signals,
        "dimensions": {"recent_activity": temporal},
        "windows": windows,
        "profile": profile_view(profile),
        "category_profile": profile["category_profile"],
        "recent_history": profile["spend_rows"][:8],
        "gemini_explanation": gemini_explanation(f"Account profile with {len(amounts)} completed transactions; temporal risk {temporal}.") if amounts else None,
    }


@app.post("/api/v1/risk/payment-initial")
def payment_initial(req: PaymentRequest):
    return initial_payment_analysis(req)


@app.post("/api/v1/risk/payment-pipeline")
def payment_pipeline(req: PaymentRequest):
    return pipeline(req)


@app.post("/api/v1/risk/payment")
def payment_risk(req: PaymentRequest):
    return pipeline(req)


@app.post("/api/v1/risk/voice")
def voice_risk(req: VoiceRequest):
    analysis = local_voice_analysis(req.transcript, req.language)
    gemini = gemini_explanation(f"Authorized call transcript ({req.language}): {req.transcript}; deterministic analysis: {analysis}")
    return {"analysis": {**analysis, "gemini_explanation": gemini}, "language": req.language, "engine": "FraudShield AI + Gemini" if gemini else "FraudShield AI deterministic fallback"}


@app.post("/api/v1/risk/message")
def message_risk(req: MessageRequest):
    t = req.text.lower()
    rules = [
        ("credential", ["otp", "pin", "password", "cvv", "verification code"], 35, "Credential extraction"),
        ("urgency", ["urgent", "immediately", "hurry", "expire", "block"], 18, "Artificial urgency"),
        ("payment", ["transfer", "send money", "pay", "upi", "invest"], 20, "Financial pressure"),
        ("authority", ["bank", "police", "rbi", "aadhaar", "kyc"], 15, "Authority impersonation"),
        ("link", ["http://", "https://", "www."], 12, "External link"),
    ]
    score = 0
    signals = []
    for code, words, weight, title in rules:
        if any(word in t for word in words):
            score += weight
            signals.append({"code": code.upper(), "title": title, "detail": f"Detected {title.lower()} indicators.", "severity": "HIGH" if weight >= 30 else "MEDIUM"})
    score = clamp(score)
    return {"risk_score": score, "risk_level": level(score), "recommended_action": action(score), "signals": signals}


@app.post("/api/v1/beneficiary/analyze")
def beneficiary_analyze(req: BeneficiaryRequest):
    risk = 5 if req.historical_count >= 3 and not req.is_new else 12 if req.is_new else 3
    return {"beneficiary_id": req.beneficiary_id, "network_risk": risk, "risk_level": level(risk), "historical_count": req.historical_count}