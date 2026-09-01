import React, { useEffect, useRef, useState } from "react";
import {
  Activity, BarChart3, BrainCircuit, CheckCircle2, Clock3, GitBranch, Loader2,
  Mic, MicOff, PhoneCall, ShieldAlert, ShieldCheck, Sparkles, WalletCards, X
} from "lucide-react";
import {
  analyzeAccount,
  analyzePaymentInitial,
  analyzePaymentPipeline,
  analyzeVoice,
  analyzeMessage
} from "../contextFusion";
import "./ContextFusionMonitor.css";

function makeId() { return `FS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function ContextFusionMonitor() {
  const [event, setEvent] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const recognitionRef = useRef(null);
  const callTextRef = useRef("");
  const lastCallAtRef = useRef(0);

  const publish = (detail) => {
    setEvent(detail);
    setExpanded(true);
    window.dispatchEvent(new CustomEvent("contextfusion:risk", { detail }));
  };

  const callLanguage = language === "hinglish" ? "hinglish" : "en-IN";

  useEffect(() => {
    const onAccount = async () => {
      publish({
        processing: true, source: "account", score: null, level: "ANALYZING",
        title: "FraudShield AI is examining your account",
        message: "Reading the production transaction history and building your personal behavioural baseline."
      });
      try {
        const r = await analyzeAccount();
        publish({ ...r, source: "account", processing: false, score: r.risk_score ?? 0,
          level: r.risk_level || "LOW", title: r.title || "Live account risk overview",
          message: r.reason || "Account analysis completed.",
          categoryProfile: r.category_profile || [], recentHistory: r.recent_history || [] });
      } catch (error) {
        publish({ source: "account", processing: false, score: 0, level: "UNAVAILABLE",
          title: "AI protection unavailable", message: "The production Node → AI bridge could not be reached.", signals: [] });
      }
    };

    const onPayment = async (e) => {
      const p = e.detail || {};
      if (!p.amount || Number(p.amount) <= 0) return;
      const paymentId = p.payment_id || makeId();
      const activeCall = Date.now() - lastCallAtRef.current <= 15 * 60 * 1000 ? callTextRef.current.trim() : "";
      const payload = { ...p, payment_id: paymentId, call_transcript: activeCall,
        call_language: callLanguage, call_active: Boolean(activeCall) };

      // TRUE staged flow: Stage 1 is completed before the NLP/final call starts.
      publish({ source: "payment", processing: true, score: null, level: "ANALYZING",
        title: "Step 1 — Initial payment analysis",
        message: "Comparing the entered amount and payment category with this user's own history before any final decision.",
        pipelineStage: "initial_analysis", pipeline: { initial_analysis: { status: "RUNNING" } },
        paymentPayload: payload });
      try {
        const initial = await analyzePaymentInitial(payload);
        publish({ source: "payment", processing: true, score: initial.risk_score ?? 0,
          level: initial.risk_level || "LOW", title: "Step 1 complete — behavioural baseline ready",
          message: "Personal history examined. Now running Multi-Vector Call NLP / Call Guard and transaction context.",
          initialAnalysis: initial, pipelineStage: "multi_vector_call_nlp", paymentPayload: payload,
          pipeline: { initial_analysis: { status: "COMPLETED", risk_score: initial.risk_score } } });

        const r = await analyzePaymentPipeline({ ...payload, initial_analysis: initial });
        publish({ ...r, source: "payment", processing: false, score: r.risk_score ?? 0,
          level: r.risk_level || "LOW",
          title: r.risk_score >= 85 ? "Critical payment risk" : r.risk_score >= 65 ? "High payment risk" : r.risk_score >= 35 ? "Payment pending verification" : "Payment approved by AI review",
          message: r.gemini_explanation || r.reason || "Full staged AI analysis completed.",
          requiresDecision: true, paymentPayload: payload, paymentDecision: null, pipelineStage: "final_risk" });
      } catch (error) {
        publish({ source: "payment", processing: false, score: 0, level: "UNAVAILABLE",
          title: "AI protection unavailable", message: "The staged AI analysis could not be completed. No AI authorization decision was made.",
          requiresDecision: false, paymentPayload: payload, error: error?.message });
      }
    };

    const onCall = async (e) => {
      const text = e.detail?.transcript || "";
      if (!text.trim()) return;
      callTextRef.current = text;
      lastCallAtRef.current = Date.now();
      setTranscript(text);
      try {
        const r = await analyzeVoice(text, e.detail?.language || callLanguage);
        const a = r.analysis || {};
        publish({ source: "call", score: a.risk_score ?? 0, level: a.risk_level || "LOW",
          title: a.risk_score >= 85 ? "Call Guard: high-risk conversation" : a.risk_score >= 35 ? "Call Guard: suspicious signals" : "Call Guard: call checked",
          message: a.gemini_explanation || "English + Hinglish Call Guard is monitoring the authorized transcript.",
          signals: a.signals || [], callGuard: a, callLanguage: e.detail?.language || callLanguage });
      } catch {}
    };

    const onMessage = async (e) => {
      const text = e.detail?.text || "";
      if (!text.trim()) return;
      try {
        const r = await analyzeMessage(text);
        if ((r.risk_score || 0) >= 25) publish({ source: "message", score: r.risk_score, level: r.risk_level,
          title: r.risk_score >= 85 ? "Critical message risk" : "Suspicious message detected",
          message: "Financial-fraud indicators were detected in the message.", signals: r.signals || [] });
      } catch {}
    };

    window.addEventListener("contextfusion:account:analysis", onAccount);
    window.addEventListener("contextfusion:payment:initiated", onPayment);
    window.addEventListener("contextfusion:call:transcript", onCall);
    window.addEventListener("contextfusion:message:received", onMessage);
    return () => {
      window.removeEventListener("contextfusion:account:analysis", onAccount);
      window.removeEventListener("contextfusion:payment:initiated", onPayment);
      window.removeEventListener("contextfusion:call:transcript", onCall);
      window.removeEventListener("contextfusion:message:received", onMessage);
      recognitionRef.current?.stop?.();
    };
  }, [language]);

  const startCall = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      publish({ source: "call", score: 0, level: "UNAVAILABLE", title: "Live call transcription unavailable",
        message: "Use a browser supporting Speech Recognition. The Call Guard accepts English and Hinglish/transliterated Hindi text.", signals: [] });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // en-IN is used for both modes because it handles Indian English/Hinglish speech better than en-US.
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += `${e.results[i][0].transcript} `;
      }
      if (text) {
        callTextRef.current += text;
        lastCallAtRef.current = Date.now();
        setTranscript(callTextRef.current);
        window.dispatchEvent(new CustomEvent("contextfusion:call:transcript", {
          detail: { transcript: callTextRef.current, language: callLanguage }
        }));
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error, e.message);
    };
    recognitionRef.current = recognition;
    callTextRef.current = "";
    setTranscript("");
    setListening(true);
    setExpanded(true);
    recognition.start();
  };

  const stopCall = () => { recognitionRef.current?.stop?.(); setListening(false); };

  const demoCall = (mode = language) => {
    const text = mode === "hinglish"
      ? "Main bank fraud department se bol raha hoon. Aapke account mein suspicious transaction hai. OTP abhi batao warna account block ho jayega. Paise secure account mein transfer karo."
      : "I am calling from the bank fraud department. Your account has a suspicious transaction. Tell me the OTP immediately or the account will be blocked. Transfer the money to the secure account.";
    callTextRef.current = text;
    lastCallAtRef.current = Date.now();
    setTranscript(text);
    window.dispatchEvent(new CustomEvent("contextfusion:call:transcript", { detail: { transcript: text, language: mode === "hinglish" ? "hinglish" : "en-IN" } }));
  };

  const decide = (decision) => {
    const payload = event?.paymentPayload;
    if (!payload) return;
    const approved = decision === "continue";
    const detail = { decision, payment: {
      ...payload, risk_score: event?.score, risk_level: event?.level,
      status: approved ? "PENDING_APPROVAL" : "CANCELLED",
      ai_outcome: event?.payment_outcome || (event?.score < 35 ? "PAYMENT_ALLOWED" : "PENDING_PAYMENT")
    }};
    window.dispatchEvent(new CustomEvent("contextfusion:payment:decision", { detail }));
    setEvent(prev => ({ ...prev, requiresDecision: false, paymentDecision: decision,
      title: approved ? "Payment sent to production approval" : "Payment cancelled",
      message: approved ? "AI review is complete. The production payment/approval backend remains authoritative." : "No payment was authorized." }));
  };

  const score = event?.score;
  const critical = score >= 85;
  const high = score >= 65;
  const pipeline = event?.pipeline || {};
  const stages = [
    ["initial_analysis", "1. Initial Analysis"],
    ["multi_vector_call_nlp", "2. Multi-Vector Call NLP / Call Guard"],
    ["transaction_context", "3. Transaction Context"],
    ["final_risk", "4. Final Risk Overview"],
    ["payment_decision", "5. Payment Outcome"]
  ];

  return <>
    <button className={`cf-floating ${critical ? "critical" : high ? "high" : ""}`} onClick={() => setExpanded(v => !v)} aria-label="Open FraudShield AI">
      <span className="cf-pulse" />{event?.processing ? <Loader2 className="spin" size={22} /> : critical ? <ShieldAlert size={23} /> : <ShieldCheck size={23} />}<span className="cf-live-dot" />
    </button>

    {expanded && <section className={`cf-guardian ${critical ? "critical" : high ? "high" : ""}`}>
      <div className="cf-head"><div className="cf-brand"><ShieldCheck size={16} /><span>FRAUD SHIELD AI</span><i>ACTIVE</i></div><button onClick={() => setExpanded(false)} aria-label="Close"><X size={15} /></button></div>

      <div className="cf-call-mode">
        <span>Call Guard language</span>
        <button className={language === "en-IN" ? "active" : ""} onClick={() => setLanguage("en-IN")}>English</button>
        <button className={language === "hinglish" ? "active" : ""} onClick={() => setLanguage("hinglish")}>Hinglish</button>
      </div>

      {event ? <div className="cf-event"><div className="cf-event-icon">{event.processing ? <Loader2 className="spin" size={19} /> : critical ? <ShieldAlert size={20} /> : <Activity size={20} />}</div><div className="cf-event-main"><b>{event.title}</b><p>{event.message}</p>{score !== null && score !== undefined && <div className="cf-score"><strong>{score}/100</strong><span>{event.level}</span></div>}{event.signals?.slice(0, 5).map((s, i) => <div className="cf-signal" key={s.code || i}>• {s.title}</div>)}</div></div> : <div className="cf-idle"><ShieldCheck size={20} /><div><b>AI protection is active</b><p>Run account analysis or start a protected payment to execute the staged AI pipeline.</p><button className="cf-run-account" onClick={() => window.dispatchEvent(new CustomEvent("contextfusion:account:analysis"))}><BarChart3 size={12} /> Analyze account history</button></div></div>}

      {event?.source === "payment" && <div className="cf-pipeline"><div className="cf-pipeline-title"><GitBranch size={14} /> Staged payment protection</div>{stages.map(([key, label]) => { const stage = pipeline[key]; return <div className="cf-stage" key={key}><span className={`cf-stage-dot ${stage?.status === "COMPLETED" || stage?.status === "PAYMENT_ALLOWED" || stage?.status === "PENDING_PAYMENT" ? "done" : ""}`} /><span>{label}</span><b>{stage ? `${stage.risk_score ?? stage.status ?? 0}${typeof stage.risk_score === "number" ? "/100" : ""}` : "WAITING"}</b></div>; })}<div className="cf-stage-final"><BrainCircuit size={14} /> Final FraudShield AI score <b>{score ?? "…"}/100</b></div>{event.payment_outcome && <div className="cf-decision-note"><CheckCircle2 size={13} /> {event.payment_outcome === "PAYMENT_ALLOWED" ? "Outcome: payment can proceed to the existing production authorization flow." : "Outcome: payment should remain pending until production verification/approval."}</div>}</div>}

      {event?.source === "account" && !event.processing && <div className="cf-profile"><div className="cf-profile-head"><div><b>Behavioural baseline</b><small>Built from the production transaction ledger</small></div><span><Sparkles size={12} /> LIVE PROFILE</span></div><div className="cf-profile-grid"><div><WalletCards size={13} /><b>{event.profile?.transaction_count ?? 0}</b><small>payments tracked</small></div><div><BarChart3 size={13} /><b>₹{Number(event.profile?.median_amount || 0).toLocaleString("en-IN")}</b><small>median payment</small></div><div><Activity size={13} /><b>₹{Number(event.profile?.typical_range?.low || 0).toLocaleString("en-IN")}–₹{Number(event.profile?.typical_range?.high || 0).toLocaleString("en-IN")}</b><small>typical range</small></div><div><Clock3 size={13} /><b>{event.profile?.normal_hours?.[0] ?? 8}:00–{event.profile?.normal_hours?.[1] ?? 23}:00</b><small>usual hours</small></div></div><div className="cf-baseline-note">{event.profile?.behavioral_rule}</div><div className="cf-data-note">Examined <b>{event.profile?.database_sample ?? 0} ledger rows</b> · category patterns, beneficiary history, device history and timing included.</div>{event.categoryProfile?.length > 0 && <div><div className="cf-mini-title">Spending style</div>{event.categoryProfile.slice(0, 5).map(c => <div className="cf-category-row" key={c.category}><span>{c.category}</span><div><i style={{ width: `${Math.min(100, c.share)}%` }} /></div><b>{c.share}%</b></div>)}</div>}{event.recentHistory?.length > 0 && <div className="cf-history"><div className="cf-mini-title">Recent payment history</div>{event.recentHistory.slice(0, 6).map((r, i) => <div className="cf-history-row" key={`${r.id || i}`}><span>{r.category}</span><b>₹{Number(r.amount || 0).toLocaleString("en-IN")}</b><small>{r.hours_ago < 1 ? "<1h" : `${Math.round(r.hours_ago)}h`}</small></div>)}</div>}<div className="cf-false-positive"><ShieldCheck size={13} /><span><b>False-positive protection:</b> a new amount or category alone does not create a high-risk verdict. Multiple independent signals must agree.</span></div></div>}

      <div className="cf-call-row"><div><PhoneCall size={15} /><b>Live Call Shield</b><small>{listening ? `Listening: ${language === "hinglish" ? "Hinglish" : "English"}` : "Ready with English + Hinglish detection"}</small></div><button className={listening ? "stop" : ""} onClick={listening ? stopCall : startCall}>{listening ? <MicOff size={14} /> : <Mic size={14} />} {listening ? "Stop" : "Mic"}</button><button className="demo" onClick={() => demoCall("english")}>English demo</button><button className="demo" onClick={() => demoCall("hinglish")}>Hinglish demo</button></div>
      {transcript && <div className="cf-transcript">{transcript}</div>}

      {event?.requiresDecision && !event.processing && <div className="cf-payment-actions"><button className="cf-cancel" onClick={() => decide("cancel")}>Cancel Payment</button><button className="cf-continue" onClick={() => decide("continue")}>{event.payment_outcome === "PAYMENT_ALLOWED" ? "Proceed to Payment" : "Send to Pending / Approval"}</button></div>}
      {event?.paymentDecision && <div className="cf-decision-note">{event.paymentDecision === "continue" ? "✓ Sent to the production payment/approval flow. AI does not move money itself." : "✓ Payment cancelled. No AI component authorized money movement."}</div>}
      <div className="cf-foot"><span><span className="green-dot" /> Monitoring layer active</span><small>AI advises; production payment authorization remains authoritative.</small></div>
    </section>}
  </>;
}