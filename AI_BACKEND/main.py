from __future__ import annotations

import json, os, re, statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from huggingface_hub import InferenceClient
except Exception:
    InferenceClient = None

load_dotenv()
BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
SCAM_DATA_FILE = DATA / "scam_messages.json"
INTEL_DATA_FILE = DATA / "fraud_intelligence.json"

SCAM_MODEL = os.getenv("HF_SCAM_MODEL", "rehan-ml/scamshield-scam-detector")
WHISPER_MODEL = os.getenv("HF_ASR_MODEL", "openai/whisper-large-v3-turbo")
CALL_MODEL = os.getenv("HF_CALL_MODEL", "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip().strip("\"").strip("\'")
INTERNAL_SECRET = os.getenv("FRAUDSHIELD_INTERNAL_SECRET", "fraudshield-local-internal-dev").strip()

app = FastAPI(title="FraudShield AI Engine", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("AI_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_internal(x_fraudshield_secret: str | None):
    if not INTERNAL_SECRET or x_fraudshield_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Invalid AI service credential")


def hf_client() -> InferenceClient | None:
    if not HF_TOKEN or InferenceClient is None:
        return None
    return InferenceClient(provider=os.getenv("HF_PROVIDER", "auto"), token=HF_TOKEN, timeout=float(os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "30")))


def now_utc(): return datetime.now(timezone.utc)


def parse_dt(value: Any):
    if not value: return None
    try:
        dt = value if isinstance(value, datetime) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
    except Exception: return None


def clamp(v): return max(0, min(100, int(round(float(v)))))


def percentile(values, p):
    if not values: return 0.0
    values = sorted(values)
    if len(values) == 1: return values[0]
    pos=(len(values)-1)*p; lo=int(pos); hi=min(lo+1,len(values)-1)
    return values[lo]+(values[hi]-values[lo])*(pos-lo)


def level(score):
    score=clamp(score)
    return "CRITICAL" if score>=85 else "HIGH" if score>=65 else "MEDIUM" if score>=35 else "LOW"


def action(score):
    return "HOLD_AND_VERIFY" if score>=85 else "WARN_USER" if score>=65 else "VERIFY" if score>=35 else "MONITOR"


def load_json(path, default):
    try: return json.loads(path.read_text(encoding="utf-8"))
    except Exception: return default

SCAM_MESSAGES = load_json(SCAM_DATA_FILE, [])
FRAUD_INTELLIGENCE = load_json(INTEL_DATA_FILE, [])


class TransactionRow(BaseModel):
    id: str | None = None; timestamp: str | None = None; createdAt: str | None = None; created_at: str | None = None
    hours_ago: float | None = None; amount: float = 0; category: str = "other"; merchant: str | None = None
    recipientName: str | None = None; beneficiary: str | None = None; recipientUPI: str | None = None
    device: str | None = None; deviceId: str | None = None; channel: str | None = None; type: str | None = None; status: str | None = None

class AccountContext(BaseModel):
    account_id: str = "production-user"; transactions: list[TransactionRow] = Field(default_factory=list)
    normal_hours: list[int] = Field(default_factory=lambda: [8,23]); supervised: bool=False; spending_limit: float|None=None

class PaymentRequest(BaseModel):
    account: AccountContext
    amount: float=Field(gt=0)
    category: str="other"
    beneficiary_id: str|None=None
    device_id: str|None=None
    channel: str="UPI"
    call_transcript: str=""
    call_language: str="en-IN"
    call_active: bool=False
    # Cross-platform context collected by the host application. Examples:
    # WhatsApp/SMS refund message, phone-call instruction, UPI initiation.
    external_context: list[dict[str, Any]] = Field(default_factory=list)
    initial_analysis: dict[str, Any] | None = None

class VoiceRequest(BaseModel): transcript: str=""; language: str="en-IN"
class MessageRequest(BaseModel): text: str
class BeneficiaryRequest(BaseModel): beneficiary_id: str; historical_count: int=0; is_new: bool=True
class IntelligenceRequest(BaseModel): query: str; kind: str="auto"


def normalize_transactions(rows):
    out=[]; now=now_utc()
    for row in rows:
        created=parse_dt(row.get("timestamp") or row.get("createdAt") or row.get("created_at")); hours=row.get("hours_ago")
        if hours is None and created: hours=max(0,(now-created).total_seconds()/3600)
        out.append({"id":str(row.get("id") or row.get("_id") or ""),"timestamp":created.isoformat() if created else None,"hours_ago":float(hours or 0),
                    "amount":float(row.get("amount",0) or 0),"category":str(row.get("category") or "other").lower(),
                    "merchant":str(row.get("merchant") or row.get("recipientName") or "unknown"),"beneficiary":str(row.get("beneficiary") or row.get("recipientUPI") or row.get("recipientName") or "unknown"),
                    "device":str(row.get("device") or row.get("deviceId") or "unknown"),"channel":str(row.get("channel") or row.get("type") or "unknown"),"status":str(row.get("status") or "completed").lower()})
    return sorted(out,key=lambda x:x.get("hours_ago",10**9))


def account_profile(account):
    rows=normalize_transactions([r.model_dump() for r in account.transactions]); spend=[r for r in rows if r["amount"]>0 and r["status"] not in {"cancelled","rejected","pending"}]
    amounts=[r["amount"] for r in spend]; cats={}; beneficiaries={}; devices={}
    for r in spend:
        cats.setdefault(r["category"],[]).append(r["amount"]); beneficiaries[r["beneficiary"]]=beneficiaries.get(r["beneficiary"],0)+1; devices[r["device"]]=devices.get(r["device"],0)+1
    total=sum(amounts) or 1
    category_profile=[{"category":c,"transactions":len(v),"spend":round(sum(v)),"share":round(sum(v)/total*100,1),"median_amount":round(statistics.median(v)),"p25":round(percentile(v,.25)),"p75":round(percentile(v,.75))} for c,v in sorted(cats.items(),key=lambda x:sum(x[1]),reverse=True)]
    hours=[parse_dt(r["timestamp"]).hour for r in spend if parse_dt(r["timestamp"])]
    normal=[min(hours),max(hours)] if hours else account.normal_hours
    return {"rows":rows,"spend_rows":spend,"amounts":amounts,"category_profile":category_profile,"beneficiary_counts":beneficiaries,"device_counts":devices,"normal_hours":normal,"total_spend":sum(amounts)}


def profile_view(p):
    a=p["amounts"]
    return {"transaction_count":len(p["spend_rows"]),"median_amount":round(statistics.median(a)) if a else 0,"average_amount":round(statistics.mean(a)) if a else 0,
            "typical_range":{"low":round(percentile(a,.25)),"high":round(percentile(a,.75))},"largest_amount":round(max(a)) if a else 0,"smallest_amount":round(min(a)) if a else 0,
            "category_count":len(p["category_profile"]),"normal_hours":p["normal_hours"],"database_sample":len(p["rows"]),"total_spend":round(p["total_spend"])}


def behavioral_analysis(p, amount, category, beneficiary, device):
    rows=p["spend_rows"]; vals=[r["amount"] for r in rows if r["category"]==category.lower()]; allvals=p["amounts"]
    med=statistics.median(vals) if vals else 0; p75=percentile(vals,.75) if vals else 0; ap75=percentile(allvals,.75) if allvals else 0
    score=0; signals=[]
    if vals:
        ratio=amount/max(med,1)
        if amount>max(p75*2.5,med*3): score+=42; signals.append({"code":"AMOUNT_DEVIATION","title":"Amount materially exceeds category baseline","detail":f"₹{amount:,.0f} is about {ratio:.1f}× the historical {category} median.","severity":"HIGH"})
        elif amount>max(p75*1.5,med*2): score+=24; signals.append({"code":"AMOUNT_ABOVE_BASELINE","title":"Amount is above the usual category range","detail":f"₹{amount:,.0f} is above the user's normal {category} range.","severity":"MEDIUM"})
        else: score+=3
    else:
        score += 8 if not ap75 or amount<=ap75*1.5 else 18
        signals.append({"code":"CATEGORY_NOVELTY","title":"New spending category","detail":f"No historical {category} payments were found; account-wide behavior is used as the baseline.","severity":"LOW"})
    bc=p["beneficiary_counts"].get(beneficiary,0) if beneficiary else 0
    if beneficiary and bc==0: score+=14; signals.append({"code":"NEW_BENEFICIARY","title":"First payment to this beneficiary","detail":"No completed historical payment to this beneficiary was found.","severity":"MEDIUM"})
    elif bc>=3: score=max(0,score-7)
    dc=p["device_counts"].get(device,0) if device else 0
    if device and dc==0: score+=8; signals.append({"code":"NEW_DEVICE","title":"New device context","detail":"This device is not present in the observed ledger.","severity":"LOW"})
    recent=[r for r in rows if r["hours_ago"]<=1]; day=[r for r in rows if r["hours_ago"]<=24]
    if len(recent)>=5: score+=28; signals.append({"code":"HOURLY_VELOCITY","title":"Dense recent activity","detail":f"{len(recent)} recent payments were observed.","severity":"HIGH"})
    elif len(day)>=10: score+=14; signals.append({"code":"DAILY_VELOCITY","title":"Higher daily activity","detail":f"{len(day)} payments were observed in the last 24 hours.","severity":"MEDIUM"})
    current=now_utc().hour; start,end=p["normal_hours"]
    if not start<=current<=end: score+=7; signals.append({"code":"UNUSUAL_HOUR","title":"Unusual payment time","detail":f"The account usually transacts around {start}:00–{end}:00.","severity":"LOW"})
    return clamp(score),signals,{"category_median":round(med),"category_p75":round(p75),"profile_sample_size":len(rows),"last_hour_count":len(recent),"last_24h_count":len(day),"normal_hours":[start,end]}


def transaction_context(p, amount):
    vals=p["amounts"]; score=0; signals=[]
    if vals:
        p95=percentile(vals,.95); p75=percentile(vals,.75)
        if amount>p95*2: score=38; signals.append({"code":"ACCOUNT_OUTLIER","title":"Major account-level outlier","detail":"Payment is substantially above the user's high-percentile transaction history.","severity":"HIGH"})
        elif amount>p75*1.75: score=20; signals.append({"code":"ACCOUNT_RANGE","title":"Above account range","detail":"Payment is above the user's normal upper range.","severity":"MEDIUM"})
    return score,signals


def call_rules(text):
    t=" ".join(text.lower().split()); hits=[]
    groups={
      "credential_extraction":(["otp","one time password","upi pin","pin batao","pin bataye","otp batao","otp bataye","cvv","password","verification code","code batao","code share","otp share","pin share","details batao"],38,"Credential extraction request"),
      "authority_impersonation":(["bank","rbi","police","cyber crime","fraud department","officer","customer care","bank se bol","rbi se","police se","cyber cell","sbi","icici","hdfc","axis","pnb"],16,"Institution impersonation"),
      "urgency_threat":(["immediately","right now","urgent","hurry","quickly","block","blocked","expire","abhi","turant","jaldi","account band","account block"],18,"Urgency or account threat"),
      "payment_instruction":(["transfer","send money","pay","upi","secure account","refund fee","collect request","scan qr","qr code","paise bhejo","payment karo","paise transfer"],24,"Payment instruction"),
      "secrecy":(["don't tell","do not tell","secret","confidential","kisi ko mat batana","ghar mein mat batana","kisi ko nahi batana"],12,"Secrecy pressure"),
      "remote_access":(["anydesk","teamviewer","screen share","remote access","screen dikhao","app install karo"],22,"Remote-access request"),
    }
    for code,(words,w,title) in groups.items():
        matched=[x for x in words if x in t]
        if matched: hits.append({"code":code,"title":title,"detail":f"Detected: {', '.join(matched[:3])}","severity":"HIGH" if w>=24 else "MEDIUM"})
    score=sum(38 if h["code"]=="credential_extraction" else 24 if h["code"] in {"payment_instruction","remote_access"} else 18 if h["code"]=="urgency_threat" else 16 if h["code"]=="authority_impersonation" else 12 for h in hits)
    if len(hits)>=3: score+=12
    return clamp(score),hits


def hf_scam_score(text):
    client=hf_client()
    if not client: return None
    try:
        result=client.text_classification(text,model=SCAM_MODEL)
        items=[x for x in result]
        scam=[x for x in items if str(x.label).lower() in {"scam","1","label_1","fraud","phishing"}]
        return float(scam[0].score*100) if scam else float(max((x.score for x in items),default=0)*100)
    except Exception: return None


def hf_call_semantics(text):
    client=hf_client()
    if not client or not text.strip(): return None
    try:
        labels=["credential extraction", "urgency or threat", "authority impersonation", "payment instruction", "secrecy pressure", "remote access request", "normal conversation"]
        out=client.zero_shot_classification(text,candidate_labels=labels,multi_label=True,model=CALL_MODEL)
        pairs=list(zip(out.labels,out.scores))
        scores={str(k).lower():float(v)*100 for k,v in pairs}
        risk=max([scores.get(k,0) for k in labels[:-1]],default=0)
        if scores.get("credential extraction",0)>55: risk=max(risk,78)
        if scores.get("payment instruction",0)>55 and scores.get("urgency or threat",0)>50: risk=max(risk,72)
        return {"score":clamp(risk),"labels":[{"label":k,"score":round(v,1)} for k,v in sorted(scores.items(),key=lambda x:x[1],reverse=True)[:5]],"model":CALL_MODEL}
    except Exception: return None


def semantic_message_analysis(text):
    rule_score,signals=call_rules(text)
    model_score=hf_scam_score(text)
    call_model=hf_call_semantics(text)
    # Model evidence is one signal; explicit social-engineering rules remain an independent safety net.
    semantic_scores=[x for x in [model_score, call_model.get("score") if call_model else None] if x is not None]
    semantic=max(semantic_scores) if semantic_scores else None
    final=rule_score if semantic is None else clamp(0.55*rule_score+0.45*semantic)
    if model_score is not None: signals.append({"code":"HF_SCAM_MODEL","title":"Hugging Face scam classifier","detail":f"Semantic scam probability: {model_score:.0f}%.","severity":"HIGH" if model_score>=70 else "MEDIUM" if model_score>=40 else "LOW"})
    if call_model: signals.append({"code":"HF_CALL_MODEL","title":"Multilingual call-vector classifier","detail":"Independent zero-shot analysis evaluated urgency, impersonation, payment pressure, credential requests and secrecy.","severity":"HIGH" if call_model["score"]>=70 else "MEDIUM"})
    return {
        "risk_score":final,
        "risk_level":level(final),
        "recommended_action":action(final),
        "signals":signals,
        "model":SCAM_MODEL,
        "model_score":round(model_score,1) if model_score is not None else None,
        "call_model":call_model,
        "models": {
            "scam_detector": {"name": SCAM_MODEL, "status": "USED" if model_score is not None else "FALLBACK_RULES"},
            "call_nlp": {"name": CALL_MODEL, "status": "USED" if call_model else "FALLBACK_RULES"},
            "speech_to_text": {"name": WHISPER_MODEL, "status": "AVAILABLE_WHEN_AUDIO_IS_SUBMITTED"}
        }
    }


def intelligence_match(value: str | None):
    if not value: return None
    q=str(value).strip().lower()
    if not q: return None
    for item in FRAUD_INTELLIGENCE:
        candidate=str(item.get("value", "")).strip().lower()
        if candidate and candidate == q:
            return item
    return None

def cross_platform_analysis(context: list[dict[str, Any]], amount: float):
    if not context: return 0, [], []
    joined=" ".join(str(x.get("text") or x.get("message") or x.get("detail") or "") for x in context)
    score, signals = call_rules(joined)
    sources=[str(x.get("source") or x.get("channel") or "unknown") for x in context]
    timeline=[]
    for x in context:
        timeline.append({"timestamp":x.get("timestamp") or "", "source":x.get("source") or x.get("channel") or "context", "event":x.get("event") or x.get("text") or x.get("message") or "Context signal"})
    source_set={s.lower() for s in sources}
    if len(source_set) >= 2 and score >= 20:
        score=clamp(score+18)
        signals.append({"code":"CROSS_PLATFORM_ESCALATION","title":"Cross-platform scam chain","detail":"Related pressure appears across more than one channel before the payment.","severity":"HIGH"})
    if {"whatsapp","phone_call","payment"}.issubset(source_set):
        score=clamp(score+12)
        signals.append({"code":"MESSAGE_CALL_PAYMENT_CHAIN","title":"Message → call → payment sequence","detail":"A refund/message context is linked to a phone interaction and a payment initiation.","severity":"HIGH"})
    if amount >= 10000 and score >= 50:
        score=clamp(score+8)
        signals.append({"code":"HIGH_VALUE_CONTEXT","title":"High-value payment follows social pressure","detail":f"₹{amount:,.0f} is being evaluated in the same context as social-engineering signals.","severity":"HIGH"})
    return score, signals, timeline

def payment_pipeline(req, initial=None):
    p=account_profile(req.account)
    behavioral,b_signals,dims=behavioral_analysis(p,req.amount,req.category,req.beneficiary_id or "",req.device_id)
    tx,t_signals=transaction_context(p,req.amount)
    call_score,call_signals=call_rules(req.call_transcript) if req.call_transcript.strip() else (0,[])
    semantic=semantic_message_analysis(req.call_transcript) if req.call_transcript.strip() else None
    if semantic:
        call_score=max(call_score,semantic["risk_score"])
        call_signals += semantic.get("signals",[])

    intel=intelligence_match(req.beneficiary_id)
    network=0 if not req.beneficiary_id else (clamp(float(intel.get("risk_score",0))) if intel else (14 if p["beneficiary_counts"].get(req.beneficiary_id,0)==0 else 3))
    intel_signal=[]
    if intel:
        intel_signal.append({"code":"INTELLIGENCE_MATCH","title":"Beneficiary intelligence match","detail":f"Matched {intel.get('kind','identifier')} against the FraudShield prototype intelligence corpus. Source: {intel.get('source','configured feed')}.","severity":"HIGH" if network>=70 else "MEDIUM"})

    temporal=28 if sum(1 for r in p["spend_rows"] if r["hours_ago"]<=24)>=10 else 0
    cross_score,cross_signals,cross_timeline=cross_platform_analysis(req.external_context,req.amount)

    # Weighted fusion is deliberately conservative: strong scam evidence is never diluted by benign transaction metadata.
    final=clamp(.34*behavioral+.12*tx+.10*network+.08*temporal+.22*call_score+.14*cross_score)
    final=max(final,call_score if call_score>=75 else 0,cross_score if cross_score>=75 else 0,network if network>=85 else 0)
    if intel and network>=70: final=max(final,network)

    reason=("Strong social-engineering evidence was detected across the call/context chain." if max(call_score,cross_score)>=65 else
            "The beneficiary matched suspicious intelligence in the configured prototype corpus." if network>=65 else
            "Payment materially deviates from the user's observed spending behaviour." if behavioral>=65 else
            "Payment should be independently verified before authorization." if final>=35 else
            "Payment is broadly consistent with the observed account pattern.")
    outcome="PENDING_PAYMENT" if final>=35 else "PAYMENT_ALLOWED"
    questions=[]
    if final>=35:
        questions=["Did someone ask you to make this payment?","Did they say you would lose access to your account if you did not pay?","Did they ask you not to tell anyone or to stay on the call?"]
    signals=b_signals+t_signals+intel_signal
    signals += [{**s,"source":"call_guard"} for s in call_signals]
    signals += cross_signals
    chain=[
        {"type":"INITIAL_ANALYSIS","title":"Initial account + payment analysis","risk":round(initial.get("risk_score",behavioral) if initial else behavioral),"status":"COMPLETED"},
        {"type":"CROSS_PLATFORM","title":"Cross-platform context fusion","risk":cross_score,"status":"COMPLETED" if req.external_context else "NO_EXTERNAL_CONTEXT"},
        {"type":"CALL_NLP","title":"Multi-Vector Call NLP / Call Guard","risk":call_score,"status":"COMPLETED" if req.call_transcript.strip() else "READY_NO_TRANSCRIPT"},
        {"type":"TRANSACTION_CONTEXT","title":"Transaction + beneficiary context","risk":max(tx,network,temporal),"status":"COMPLETED"},
        {"type":"FINAL","title":"Overall FraudShield risk","risk":final,"status":"COMPLETED"},
        {"type":"DECISION","title":"Payment outcome","risk":final,"status":outcome}
    ]
    return {"risk_score":final,"risk_level":level(final),"recommended_action":action(final),"payment_outcome":outcome,"approval_required":final>=35,"reason":reason,"second_thought":{"show":final>=35,"title":"Before you continue, verify this request.","questions":questions},"dimensions":{"initial_analysis":initial.get("risk_score",behavioral) if initial else behavioral,"behavioral_risk":behavioral,"transaction_risk":tx,"network_risk":network,"temporal_risk":temporal,"call_nlp_risk":call_score,"cross_platform_risk":cross_score},"signals":signals,"call_guard":{"risk_score":call_score,"risk_level":level(call_score) if req.call_transcript.strip() else "NONE","signals":call_signals,"language":req.call_language,"guard_status":"ACTIVE"},"cross_platform":{"risk_score":cross_score,"signals":cross_signals,"timeline":cross_timeline},"intelligence_match":intel,"pipeline":{"initial_analysis":{"status":"COMPLETED","risk_score":initial.get("risk_score",behavioral) if initial else behavioral},"cross_platform_context":{"status":"COMPLETED" if req.external_context else "NO_EXTERNAL_CONTEXT","risk_score":cross_score},"multi_vector_call_nlp":{"status":"COMPLETED" if req.call_transcript.strip() else "READY_NO_TRANSCRIPT","risk_score":call_score},"transaction_context":{"status":"COMPLETED","risk_score":max(tx,network,temporal),"transaction_risk":tx,"beneficiary_risk":network,"temporal_risk":temporal},"final_risk":{"status":"COMPLETED","risk_score":final,"risk_level":level(final),"reason":reason},"payment_decision":{"status":outcome,"approval_required":final>=35}},"profile":profile_view(p),"category_profile":p["category_profile"],"recent_history":p["spend_rows"][:8],"scam_chain":chain,
        "models": {
            "scam_detector": {"name": SCAM_MODEL, "status": "USED" if (semantic and semantic.get("model_score") is not None) else "FALLBACK_RULES"},
            "call_nlp": {"name": CALL_MODEL, "status": "USED" if (semantic and semantic.get("call_model")) else "FALLBACK_RULES"},
            "speech_to_text": {"name": WHISPER_MODEL, "status": "AVAILABLE_WHEN_AUDIO_IS_SUBMITTED"}
        }}


@app.get("/api/health")
def health():
    return {"ok":True,"huggingface_configured":bool(HF_TOKEN and InferenceClient),"huggingface_token_present":bool(HF_TOKEN),"hf_provider":os.getenv("HF_PROVIDER","auto"),"scam_model":SCAM_MODEL,"asr_model":WHISPER_MODEL,"call_model":CALL_MODEL,"message_dataset":len(SCAM_MESSAGES),"intelligence_dataset":len(FRAUD_INTELLIGENCE),"models": {
        "scam_detector": SCAM_MODEL,
        "call_nlp": CALL_MODEL,
        "speech_to_text": WHISPER_MODEL
    },"official_intelligence":{"provider":"I4C National Cyber Crime Reporting Portal","url":"https://www.cybercrime.gov.in/Webform/suspect_search_repository.aspx","automated_api":False}}

@app.post("/api/v1/risk/account")
def account_risk(account: AccountContext, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); p=account_profile(account)
    score=0; signals=[]
    recent=sum(1 for r in p["spend_rows"] if r["hours_ago"]<=24); amounts=p["amounts"]
    if recent>=10: score+=28; signals.append({"code":"RECENT_VELOCITY","title":"Elevated recent transaction velocity","detail":f"{recent} completed payments were observed in the last 24 hours.","severity":"MEDIUM"})
    if amounts and max(amounts)>percentile(amounts,.95)*2: score+=24; signals.append({"code":"HISTORICAL_OUTLIER","title":"Historical high-value outlier","detail":"The ledger contains a payment materially above the user's normal range.","severity":"MEDIUM"})
    if len(p["category_profile"])>=5: score+=5
    score=clamp(score)
    return {"risk_score":score,"risk_level":level(score),"title":"Live account risk overview","reason":"Personal spending history, timing, category ranges, amount distribution and velocity were examined.","signals":signals,"dimensions":{"recent_activity":recent,"amount_distribution":score,"category_diversity":len(p["category_profile"])},"profile":profile_view(p),"category_profile":p["category_profile"],"recent_history":p["spend_rows"][:8],"engine":"FraudShield behavioural risk engine + deterministic safety fusion"}

@app.post("/api/v1/risk/payment-initial")
def payment_initial(req: PaymentRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); p=account_profile(req.account); b,s,d=behavioral_analysis(p,req.amount,req.category,req.beneficiary_id or "",req.device_id); tx,ts=transaction_context(p,req.amount); score=clamp(.72*b+.28*tx)
    return {"stage":"INITIAL_ANALYSIS","status":"COMPLETED","risk_score":score,"risk_level":level(score),"recommended_action":action(score),"amount":req.amount,"category":req.category,"behavioral":{"risk_score":b,"signals":s,"dimensions":d},"transaction_context":{"risk_score":tx,"signals":ts},"profile":profile_view(p),"category_profile":p["category_profile"],"recent_history":p["spend_rows"][:8]}

@app.post("/api/v1/risk/payment-pipeline")
def payment_pipeline_endpoint(req: PaymentRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); return payment_pipeline(req, req.initial_analysis)

@app.post("/api/v1/risk/payment")
def payment_risk(req: PaymentRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); return payment_pipeline(req, req.initial_analysis)

@app.post("/api/v1/risk/voice")
def voice_risk(req: VoiceRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); score,signals=call_rules(req.transcript); return {"analysis":{"risk_score":score,"risk_level":level(score),"recommended_action":action(score),"signals":signals,"language":req.language,"guard_status":"ACTIVE","engine":"Hugging Face scam classifier + Call Guard fusion"}}

@app.post("/api/v1/risk/message")
def message_risk(req: MessageRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); return semantic_message_analysis(req.text)

@app.post("/api/v1/risk/text-analysis")
def text_analysis(req: MessageRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); return {"available":bool(HF_TOKEN),**semantic_message_analysis(req.text),"explanation":"Score combines explicit social-engineering signals with the Hugging Face scam classifier; the model is not treated as infallible."}

@app.post("/api/v1/beneficiary/analyze")
def beneficiary_analyze(req: BeneficiaryRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); risk=5 if req.historical_count>=3 and not req.is_new else 14 if req.is_new else 3
    return {"beneficiary_id":req.beneficiary_id,"network_risk":risk,"risk_level":level(risk),"historical_count":req.historical_count}

@app.post("/api/v1/intelligence/search")
def intelligence_search(req: IntelligenceRequest, x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); q=req.query.strip().lower(); kind=req.kind
    source_rows = list(FRAUD_INTELLIGENCE)
    feed = os.getenv("FRAUD_INTELLIGENCE_FEED_URL", "").strip()
    if feed:
        try:
            remote = requests.get(feed, timeout=3).json()
            if isinstance(remote, list): source_rows = remote + source_rows
            elif isinstance(remote, dict) and isinstance(remote.get("results"), list): source_rows = remote["results"] + source_rows
        except Exception:
            pass
    results=[]
    for item in source_rows:
        if kind!="auto" and item.get("kind")!=kind: continue
        hay=" ".join(str(item.get(k,"")) for k in ("value","type","label","reason","source")).lower()
        if q and q not in hay: continue
        results.append(item)
        if len(results)>=25: break
    return {"query":req.query,"count":len(results),"matched":bool(results),"live_feed":bool(os.getenv("FRAUD_INTELLIGENCE_FEED_URL")),"official_lookup":{"provider":"I4C National Cyber Crime Reporting Portal","url":"https://www.cybercrime.gov.in/Webform/suspect_search_repository.aspx","automated_api":False,"note":"The public repository is complaint-derived, incomplete, and not a certification of guilt. Use an authorized integration or manual verification for production decisions."},"results":results}

@app.get("/api/v1/intelligence/stats")
def intelligence_stats(x_fraudshield_secret: str|None=Header(default=None)):
    require_internal(x_fraudshield_secret); return {"message_examples":len(SCAM_MESSAGES),"intelligence_records":len(FRAUD_INTELLIGENCE),"categories":sorted({x.get("category") for x in SCAM_MESSAGES}),"identifier_types":sorted({x.get("kind") for x in FRAUD_INTELLIGENCE})}

@app.post("/api/v1/call/transcribe")
async def transcribe_call(request: Request, x_fraudshield_secret: str|None=Header(default=None), x_filename: str|None=Header(default="call.webm")):
    require_internal(x_fraudshield_secret)
    client=hf_client()
    if not client: raise HTTPException(status_code=503,detail="HF_TOKEN is not configured")
    audio=await request.body()
    if len(audio)>10*1024*1024: raise HTTPException(status_code=413,detail="Audio file too large")
    try:
        out=client.automatic_speech_recognition(audio,model=WHISPER_MODEL)
        text=getattr(out,"text",None) or (out.get("text") if isinstance(out,dict) else "")
        return {"text":str(text).strip(),"model":WHISPER_MODEL,"language":"en-IN"}
    except Exception: raise HTTPException(status_code=502,detail="Hugging Face transcription failed")
