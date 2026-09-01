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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const paymentPayloadRef = useRef(null);
  const initialAnalysisRef = useRef(null);
  const callSessionActiveRef = useRef(false);
  const finalizePaymentRef = useRef(null);
  const finalizeTimerRef = useRef(null);
  const autoDemoTimerRef = useRef(null);
  const finalizingPaymentRef = useRef(false);
  const lastFinalizedTranscriptRef = useRef("");

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
      finalizingPaymentRef.current = false;
      lastFinalizedTranscriptRef.current = "";
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
        paymentPayloadRef.current = payload;
        initialAnalysisRef.current = initial;
        publish({ source: "payment", processing: true, score: initial.risk_score ?? 0,
          level: initial.risk_level || "LOW", title: "Step 1 complete — account history analyzed",
          message: "Score #1 is ready. FraudShield is now starting Call Guard automatically — no button or manual dashboard action is required.",
          initialAnalysis: initial, pipelineStage: "multi_vector_call_nlp", paymentPayload: payload,
          pipeline: { initial_analysis: { status: "COMPLETED", risk_score: initial.risk_score }, multi_vector_call_nlp: { status: "RUNNING" } } });
        // Stage 1 is fully automatic. Once Score #1 is ready, the Call Guard
        // panel is presented as the next stage. The presenter can choose Mic
        // or Run demo call there; the existing Call Guard controls remain
        // unchanged. The final fusion is triggered by the resulting transcript.
        callSessionActiveRef.current = true;
        clearTimeout(autoDemoTimerRef.current);
      } catch (error) {
        publish({ source: "payment", processing: false, score: 0, level: "UNAVAILABLE",
          title: "AI protection unavailable", message: "The staged AI analysis could not be completed. No AI authorization decision was made.",
          requiresDecision: false, paymentPayload: payload, error: error?.message });
      }
    };

    const finalizePayment = async (transcriptText) => {
      const base = paymentPayloadRef.current;
      const initial = initialAnalysisRef.current;
      const normalizedTranscript = String(transcriptText || "").trim();
      if (!base || !initial || finalizingPaymentRef.current) return;
      // Never run the expensive final fusion twice for the same call transcript.
      if (normalizedTranscript && lastFinalizedTranscriptRef.current === normalizedTranscript) return;
      finalizingPaymentRef.current = true;
      lastFinalizedTranscriptRef.current = normalizedTranscript;
      publish({ source: "payment", processing: true, score: null, level: "ANALYZING",
        title: "Step 3 — Final FraudShield verdict",
        message: "Merging Score #1, Call Guard, account behaviour and cross-platform context into the final payment decision.",
        pipelineStage: "final_risk", paymentPayload: { ...base, call_transcript: normalizedTranscript, call_language: callLanguage },
        pipeline: { initial_analysis: { status: "COMPLETED", risk_score: initial.risk_score },
          multi_vector_call_nlp: { status: "COMPLETED" }, final_risk: { status: "RUNNING" } } });
      try {
        const r = await analyzePaymentPipeline({
          ...base,
          call_transcript: normalizedTranscript,
          call_language: callLanguage,
          call_active: Boolean(transcriptText),
          initial_analysis: initial,
        });
        const detail = { ...r, source: "payment", processing: false, score: r.risk_score ?? 0,
          level: r.risk_level || "LOW",
          title: r.risk_score >= 85 ? "Critical payment risk" : r.risk_score >= 65 ? "High payment risk" : r.risk_score >= 35 ? "Payment pending verification" : "Payment approved by AI review",
          message: r.reason || "Full staged AI analysis completed. The final score is advisory; the account holder decides whether to approve or keep the payment pending.",
          requiresDecision: true, payment_outcome: "REQUIRES_USER_DECISION", paymentPayload: { ...base, call_transcript: normalizedTranscript, call_language: callLanguage }, paymentDecision: null, pipelineStage: "final_risk" };
        publish(detail);
        window.dispatchEvent(new CustomEvent("contextfusion:payment:final", { detail }));
      } catch (error) {
        publish({ source: "payment", processing: false, score: 0, level: "UNAVAILABLE",
          title: "Final payment verdict unavailable", message: "The final fusion request failed, so no payment was authorized. Retry the Call Guard once to regenerate the final verdict.",
          requiresDecision: false, paymentPayload: { ...base, call_transcript: normalizedTranscript }, error: error?.message });
      } finally {
        finalizingPaymentRef.current = false;
      }
    };

    finalizePaymentRef.current = finalizePayment;

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
          message: "English + Hinglish Call Guard is monitoring the authorized transcript.",
          signals: a.signals || [], callGuard: a, callLanguage: e.detail?.language || callLanguage });
        // Once a complete Call Guard analysis exists, immediately move the
        // protected payment flow to the final fusion stage. Do not require a
        // second click, another dashboard, or a manual "analysis" action.
        if (paymentPayloadRef.current && initialAnalysisRef.current && callTextRef.current.trim()) {
          clearTimeout(finalizeTimerRef.current);
          clearTimeout(autoDemoTimerRef.current);
          finalizePaymentRef.current?.(callTextRef.current.trim());
        }
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
      clearTimeout(finalizeTimerRef.current);
      clearTimeout(autoDemoTimerRef.current);
      finalizePaymentRef.current = null;
    };
  }, [language]);

  const startCall = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      publish({
        source:"call", score:0, level:"UNAVAILABLE",
        title:"Live microphone transcription is unavailable",
        message:"FraudShield is switching to its safe demo Call Guard so the staged payment flow can still be completed.",
        signals:[]
      });
      // Embedded browsers/webviews may not expose SpeechRecognition. Keep the
      // end-to-end demo functional without pretending this is a real call.
      if (paymentPayloadRef.current && initialAnalysisRef.current) {
        const text = language === "hinglish"
          ? "Main bank fraud department se bol raha hoon. Aapke account mein suspicious transaction hai. OTP abhi batao warna account block ho jayega. Paise secure account mein transfer karo."
          : "I am calling from the bank fraud department. Your account has a suspicious transaction. Tell me the OTP immediately or the account will be blocked. Transfer the money to the secure account.";
        callSessionActiveRef.current = true;
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("contextfusion:call:transcript", {
            detail: { transcript: text, language: callLanguage, demo: true }
          }));
        }, 250);
      }
      return;
    }
    try {
      const stream=await navigator.mediaDevices?.getUserMedia?.({audio:true});
      if(stream && window.MediaRecorder){
        audioChunksRef.current=[];
        const recorder=new MediaRecorder(stream);
        recorder.ondataavailable=e=>{if(e.data.size)audioChunksRef.current.push(e.data)};
        mediaRecorderRef.current=recorder;
        recorder.start(1000);
      }
    } catch(_) {}
    const recognition=new SpeechRecognition(); recognition.continuous=true; recognition.interimResults=true; recognition.lang="en-IN";
    recognition.onresult=(e)=>{let text="";for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)text+=`${e.results[i][0].transcript} `}if(text){callTextRef.current+=text;lastCallAtRef.current=Date.now();setTranscript(callTextRef.current);window.dispatchEvent(new CustomEvent("contextfusion:call:transcript",{detail:{transcript:callTextRef.current,language:callLanguage}}));}};
    recognition.onend=()=>{setListening(false); callSessionActiveRef.current=false; if(paymentPayloadRef.current && initialAnalysisRef.current && callTextRef.current.trim()) finalizePayment(callTextRef.current.trim());}; recognition.onerror=e=>console.warn("Speech recognition:",e.error);
    recognitionRef.current=recognition; callTextRef.current="";setTranscript("");setListening(true);setExpanded(true);recognition.start();
  };

  const stopCall = async () => {
    callSessionActiveRef.current = false;
    recognitionRef.current?.stop?.(); setListening(false);
    const recorder=mediaRecorderRef.current; if(recorder && recorder.state!=="inactive") recorder.stop();
    recorder?.stream?.getTracks?.().forEach(t=>t.stop());
    if(recorder && audioChunksRef.current.length){
      const blob=new Blob(audioChunksRef.current,{type:recorder.mimeType||"audio/webm"});
      try{
        const bytes=new Uint8Array(await blob.arrayBuffer()); let binary=""; const chunk=0x8000;
        for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
        const token=localStorage.getItem("token")||localStorage.getItem("fraudshield-token")||"";
        const r=await fetch("/api/ai/transcribe",{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({audio_base64:btoa(binary),filename:"call.webm",mime_type:recorder.mimeType||"audio/webm"})});
        if(r.ok){const d=await r.json();if(d.text){callTextRef.current=d.text;setTranscript(d.text);lastCallAtRef.current=Date.now();window.dispatchEvent(new CustomEvent("contextfusion:call:transcript",{detail:{transcript:d.text,language:callLanguage}})); await finalizePaymentRef.current?.(d.text);}}
      }catch(_){}
    }
    // SpeechRecognition may be available without MediaRecorder permission.
    // In that case still advance to the final fusion stage from the transcript.
    if (callTextRef.current.trim() && paymentPayloadRef.current && initialAnalysisRef.current) {
      await finalizePaymentRef.current?.(callTextRef.current.trim());
    }
    mediaRecorderRef.current=null;audioChunksRef.current=[];
  };

  const demoCall = (mode = language) => {
    const text = mode === "hinglish"
      ? "Main bank fraud department se bol raha hoon. Aapke account mein suspicious transaction hai. OTP abhi batao warna account block ho jayega. Paise secure account mein transfer karo."
      : "I am calling from the bank fraud department. Your account has a suspicious transaction. Tell me the OTP immediately or the account will be blocked. Transfer the money to the secure account.";
    callTextRef.current = text;
    lastCallAtRef.current = Date.now();
    setTranscript(text);
    window.dispatchEvent(new CustomEvent("contextfusion:call:transcript", { detail: { transcript: text, language: mode === "hinglish" ? "hinglish" : "en-IN", demo: true } }));
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
    ["multi_vector_call_nlp", "2. Automatic Call Guard"],
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

      {event?.source === "payment" && <div className="cf-pipeline"><div className="cf-pipeline-title"><GitBranch size={14} /> Automatic payment protection</div>{stages.map(([key, label]) => { const stage = pipeline[key]; return <div className="cf-stage" key={key}><span className={`cf-stage-dot ${stage?.status === "COMPLETED" || stage?.status === "PAYMENT_ALLOWED" || stage?.status === "PENDING_PAYMENT" ? "done" : ""}`} /><span>{label}</span><b>{stage ? `${stage.risk_score ?? stage.status ?? 0}${typeof stage.risk_score === "number" ? "/100" : ""}` : "WAITING"}</b></div>; })}<div className="cf-stage-final"><BrainCircuit size={14} /> Final FraudShield AI score <b>{score ?? "…"}/100</b></div>{event.payment_outcome && <div className="cf-decision-note"><CheckCircle2 size={13} /> {event.payment_outcome === "REQUIRES_USER_DECISION" ? "Final AI score is ready. The account holder chooses Pending or Approve on the payment screen." : event.payment_outcome === "PAYMENT_ALLOWED" ? "AI assessment is complete. The account holder still makes the final payment choice." : "AI assessment is complete. The account holder still makes the final payment choice."}</div>}</div>}

      {event?.source === "account" && !event.processing && <div className="cf-profile"><div className="cf-profile-head"><div><b>Behavioural baseline</b><small>Built from the production transaction ledger</small></div><span><Sparkles size={12} /> LIVE PROFILE</span></div><div className="cf-profile-grid"><div><WalletCards size={13} /><b>{event.profile?.transaction_count ?? 0}</b><small>payments tracked</small></div><div><BarChart3 size={13} /><b>₹{Number(event.profile?.median_amount || 0).toLocaleString("en-IN")}</b><small>median payment</small></div><div><Activity size={13} /><b>₹{Number(event.profile?.typical_range?.low || 0).toLocaleString("en-IN")}–₹{Number(event.profile?.typical_range?.high || 0).toLocaleString("en-IN")}</b><small>typical range</small></div><div><Clock3 size={13} /><b>{event.profile?.normal_hours?.[0] ?? 8}:00–{event.profile?.normal_hours?.[1] ?? 23}:00</b><small>usual hours</small></div></div><div className="cf-baseline-note">{event.profile?.behavioral_rule}</div><div className="cf-data-note">Examined <b>{event.profile?.database_sample ?? 0} ledger rows</b> · category patterns, beneficiary history, device history and timing included.</div>{event.categoryProfile?.length > 0 && <div><div className="cf-mini-title">Spending style</div>{event.categoryProfile.slice(0, 5).map(c => <div className="cf-category-row" key={c.category}><span>{c.category}</span><div><i style={{ width: `${Math.min(100, c.share)}%` }} /></div><b>{c.share}%</b></div>)}</div>}{event.recentHistory?.length > 0 && <div className="cf-history"><div className="cf-mini-title">Recent payment history</div>{event.recentHistory.slice(0, 6).map((r, i) => <div className="cf-history-row" key={`${r.id || i}`}><span>{r.category}</span><b>₹{Number(r.amount || 0).toLocaleString("en-IN")}</b><small>{r.hours_ago < 1 ? "<1h" : `${Math.round(r.hours_ago)}h`}</small></div>)}</div>}<div className="cf-false-positive"><ShieldCheck size={13} /><span><b>False-positive protection:</b> a new amount or category alone does not create a high-risk verdict. Multiple independent signals must agree.</span></div></div>}

      {event?.source === "payment" && !event.processing && event?.cross_platform && (
        <div className="cf-chain">
          <div className="cf-chain-head">
            <div><b>Scam chain timeline</b><small>How the manipulation developed across channels</small></div>
            <span>{event.cross_platform.risk_score >= 65 ? "HIGH SOCIAL-ENGINEERING RISK" : "CONTEXT LINKED"}</span>
          </div>
          <div className="cf-chain-list">
            {(event.cross_platform.timeline?.length
              ? event.cross_platform.timeline
              : [
                  { source: "payment", event: "UPI payment initiated", timestamp: "", text: "Payment context created" }
                ]).map((item, i) => (
              <div className="cf-chain-item" key={`${item.source}-${i}`}>
                <div className="cf-chain-dot" />
                <div className="cf-chain-copy">
                  <div><b>{item.event || "Context signal"}</b><small>{item.source || "context"}</small></div>
                  <p>{item.text || "Related event detected."}</p>
                </div>
              </div>
            ))}
          </div>
          {event.models && (
            <div className="cf-models">
              {Object.entries(event.models).map(([key, model]) => (
                <span key={key} title={model.name}>
                  <b>{key === "scam_detector" ? "Scam" : key === "call_nlp" ? "Call NLP" : "Whisper"}</b>
                  {model.status === "USED" ? "LIVE" : model.status === "FALLBACK_RULES" ? "FALLBACK" : "READY"}
                </span>
              ))}
            </div>
          )}
          {event.cross_platform.risk_score >= 35 && (
            <div className="cf-safety-actions">
              <b>What to do now</b>
              <div>• If the caller creates urgency, hang up and contact the organisation using its official number.</div>
              <div>• Never share OTP, UPI PIN, CVV or passwords with a caller.</div>
              <div>• If a refund or KYC request asks you to pay first, open the official app/website yourself instead of using the caller's link.</div>
            </div>
          )}
        </div>
      )}

      <div className="cf-call-row"><div><PhoneCall size={15} /><b>Call Guard</b><small>{listening ? `Listening: ${language === "hinglish" ? "Hinglish" : "English"}` : event?.pipeline?.initial_analysis?.status === "COMPLETED" ? "Score #1 complete · choose Mic or Run demo call" : "Ready for protected payment analysis"}</small></div><button className={listening ? "stop" : ""} onClick={listening ? stopCall : startCall}>{listening ? <MicOff size={14} /> : <Mic size={14} />} {listening ? "Stop" : "Mic"}</button><button className="demo" onClick={() => demoCall("english")}>Run demo call</button></div>
      {transcript && <div className="cf-transcript">{transcript}</div>}

      {event?.requiresDecision && !event.processing && <div className="cf-decision-note"><CheckCircle2 size={13} /> Final AI verdict is ready. Choose Keep in Pending Payments or Approve Payment from the main payment screen.</div>}
      {event?.paymentDecision && <div className="cf-decision-note">{event.paymentDecision === "continue" ? "✓ Sent to the production payment/approval flow. AI does not move money itself." : "✓ Payment cancelled. No AI component authorized money movement."}</div>}
      <div className="cf-foot"><span><span className="green-dot" /> Monitoring layer active</span><small>AI advises; production payment authorization remains authoritative.</small></div>
    </section>}
  </>;
}