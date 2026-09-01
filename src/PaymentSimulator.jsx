import React, { useEffect, useState } from "react";
import "./PaymentRiskAnalyzer.css";

import {
  ChevronLeft,
  ShieldCheck,
  Home,
  CreditCard,
  BrainCircuit,
  AlertTriangle,
  Users,
  Bell,
  Activity,
  IndianRupee,
  User,
  Monitor,
  Info,
  Flag,
  UserCheck,
} from "lucide-react";

import { emitPaymentInitiated } from "./contextFusion";

// Destination keys shared with Dashboard's own sidebar hrefs and with
// RiskAnalysis's sidebar (see App.jsx's onNavigate dispatcher) -- clicking
// any of these routes to the same place regardless of which page you're on.
const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", destination: "dashboard" },
  { icon: CreditCard, label: "Transactions", destination: "transactions" },
  { icon: BrainCircuit, label: "Risk Analysis", destination: "risk-analysis" },
  { icon: AlertTriangle, label: "Scam Intelligence", destination: "fraud-intelligence" },
  { icon: Users, label: "Family Protection", destination: "family-protection" },
  { icon: Bell, label: "Emergency Center", destination: "emergency" },
];

// These feed the real FraudShield AI payment contract (beneficiary_id /
// device_id) that ContextFusionMonitor forwards to the AI backend, instead
// of adding fake points to a local score.
const CONTEXT_TOGGLES = [
  {
    key: "newBeneficiary",
    icon: User,
    title: "New Beneficiary",
    subtitle: "Tell FraudShield AI this recipient has never been paid before",
  },
  {
    key: "unknownDevice",
    icon: Monitor,
    title: "Unknown Device",
    subtitle: "Tell FraudShield AI this device isn't recognized",
  },
];

// Matches the Transaction model's `category` enum exactly (models/Transaction.js)
// and is forwarded as-is to the AI payment contract's `category` field.
const CATEGORY_OPTIONS = [
  { value: "shopping", label: "Shopping" },
  { value: "gaming", label: "Gaming" },
  { value: "food", label: "Food & Dining" },
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const LEVEL_STYLES = {
  CRITICAL: { label: "CRITICAL RISK", color: "#f43f5e", soft: "rgba(244,63,94,0.12)" },
  HIGH: { label: "HIGH RISK", color: "#f97316", soft: "rgba(249,115,22,0.12)" },
  MEDIUM: { label: "MEDIUM RISK", color: "#f59e0b", soft: "rgba(245,158,11,0.12)" },
  LOW: { label: "LOW RISK", color: "#22c55e", soft: "rgba(34,197,94,0.12)" },
  ANALYZING: { label: "ANALYZING...", color: "#60a5fa", soft: "rgba(96,165,250,0.12)" },
  UNAVAILABLE: { label: "AI UNAVAILABLE", color: "#8b93a7", soft: "rgba(139,147,167,0.12)" },
};

const NOT_ANALYZED_STYLE = { label: "NOT ANALYZED", color: "#8b93a7", soft: "rgba(139,147,167,0.12)" };

// Labels for the real risk sub-scores FraudShield AI returns in
// dimensions{}. "initial_analysis" is intentionally left out - it is a
// blend of behavioral + transaction, both already shown on their own.
const DIMENSION_LABELS = {
  behavioral_risk: {
    title: "Behavioral analysis",
    detail: "How this payment compares with the account's own spending history.",
  },
  transaction_risk: {
    title: "Transaction context",
    detail: "How the amount compares with the account's typical transaction sizes.",
  },
  network_risk: {
    title: "Beneficiary network",
    detail: "Whether this beneficiary has a track record on this account.",
  },
  temporal_risk: {
    title: "Temporal activity",
    detail: "Recent payment velocity and time-of-day pattern.",
  },
  call_nlp_risk: {
    title: "Call Guard (voice)",
    detail: "Signals detected in the linked call transcript, if any.",
  },
};

function formatCurrency(value) {
  const numericValue = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "₹0";
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
}

// A stable per-browser "known device" id, persisted in localStorage so that
// repeat payments from this browser (with "Unknown Device" left unchecked)
// really do build up device history the AI backend can see across
// submissions, instead of a fake always-the-same-answer placeholder.
function getOrCreateKnownDeviceId() {
  const STORAGE_KEY = "fraudshield_known_device_id";
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `device-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "device-unknown-storage";
  }
}

// When left unchecked, this is exactly the string that will also be stored
// as the transaction's recipientName if the payment goes through, so the
// AI backend's beneficiary-history check is checking against something
// real. When checked, a unique suffix is appended so the deterministic
// engine genuinely evaluates it as a first-time beneficiary.
function buildBeneficiaryId(recipientName, treatAsNew) {
  const trimmed = recipientName.trim();
  if (!trimmed) return null;
  return treatAsNew ? `${trimmed} (new-${Date.now()})` : trimmed;
}

function buildDeviceId(treatAsUnknown) {
  return treatAsUnknown
    ? `unknown-device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    : getOrCreateKnownDeviceId();
}

function colorForSeverity(severity) {
  if (severity === "HIGH") return "#f97316";
  if (severity === "MEDIUM") return "#f59e0b";
  return "#60a5fa";
}

function getAuthToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("fraudshield-token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  } catch {
    return null;
  }
}

function levelFromScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return NOT_ANALYZED_STYLE;
  if (n >= 85) return LEVEL_STYLES.CRITICAL;
  if (n >= 65) return LEVEL_STYLES.HIGH;
  if (n >= 35) return LEVEL_STYLES.MEDIUM;
  return LEVEL_STYLES.LOW;
}

function RiskGauge({ score, level }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(Math.max(score, 0), 100);
  const percentage = safeScore / 100;
  const dash = circumference * percentage;

  return (
    <div className="gauge-wrap">
      <svg className="risk-gauge-svg" width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#1b2333" strokeWidth="16" />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 110 110)"
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>

      <div className="gauge-center">
        <div className="gauge-score">{safeScore}</div>
        <div className="gauge-max">/ 100</div>
        <div className="gauge-pill" style={{ background: level.soft, color: level.color }}>
          {level.label}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSimulator({ onBack, onNavigate }) {
  const [amount, setAmount] = useState("25,000");
  const [recipient, setRecipient] = useState("Rahul Kumar");
  const [recipientUPI, setRecipientUPI] = useState("rahul@upi");
  const [category, setCategory] = useState("other");
  const [crossPlatformDemo, setCrossPlatformDemo] = useState(true);

  const [factors, setFactors] = useState({
    newBeneficiary: true,
    unknownDevice: true,
  });

  // "idle" | "input_error" | "auth_required" | "waiting" | "complete" | "error"
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiError, setAiError] = useState("");
  const [pendingPayment, setPendingPayment] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [stageScores, setStageScores] = useState({ initial: null, call: null, final: null });

  // "idle" | "submitting" | "success" | "error"
  const [txnStatus, setTxnStatus] = useState("idle");
  const [txnError, setTxnError] = useState("");
  const [txnResult, setTxnResult] = useState(null);
  const [secondThought, setSecondThought] = useState(false);
  const [safetyAnswers, setSafetyAnswers] = useState({asked:false,threatened:false,secrecy:false});
  const finalPanelRef = React.useRef(null);

  // ContextFusionMonitor (mounted once at the App root) owns the actual
  // payment-initial / Call Guard / payment-analysis calls, and broadcasts
  // its result on the real window event "contextfusion:payment:decision".
  // This component only ever (a) tells it a payment started via
  // emitPaymentInitiated, and (b) listens on window for that decision. It
  // never calls /api/ai/* directly.
  useEffect(() => {
    function handleRisk(e) {
      const detail = e.detail || {};
      if (detail.source !== "payment" && detail.source !== "call") return;
      const pipeline = detail.pipeline || {};
      setStageScores(prev => ({
        initial: detail.initialAnalysis?.risk_score ?? pipeline.initial_analysis?.risk_score ?? prev.initial,
        call: detail.callGuard?.risk_score ?? detail.analysis?.risk_score ?? pipeline.multi_vector_call_nlp?.risk_score ?? prev.call,
        final: detail.risk_score ?? prev.final
      }));
      if (detail.processing) setAiStatus("waiting");
    }
    function handleFinal(e) {
      const detail = e.detail || {};
      if (detail.source !== "payment") return;
      setFinalResult({ decision: null, payment: { ...(detail.paymentPayload || pendingPayment || {}), risk_score: detail.risk_score, risk_level: detail.risk_level, status: "READY_FOR_USER_DECISION", ai_outcome: "REQUIRES_USER_DECISION" }, aiDetail: detail });
      setStageScores(prev => ({ ...prev, final: detail.risk_score ?? prev.final }));
      setAiStatus("complete");
      window.setTimeout(() => finalPanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" }), 120);
    }
    function handleDecision(e) {
      const detail = e.detail || {};
      setFinalResult(detail);
      setAiStatus("complete");
    }
    window.addEventListener("contextfusion:risk", handleRisk);
    window.addEventListener("contextfusion:payment:final", handleFinal);
    window.addEventListener("contextfusion:payment:decision", handleDecision);
    return () => {
      window.removeEventListener("contextfusion:risk", handleRisk);
      window.removeEventListener("contextfusion:payment:final", handleFinal);
      window.removeEventListener("contextfusion:payment:decision", handleDecision);
    };
  }, [pendingPayment]);

  function resetAnalysis() {
    setAiStatus("idle");
    setAiError("");
    setPendingPayment(null);
    setFinalResult(null);
    setStageScores({ initial: null, call: null, final: null });
    setTxnStatus("idle");
    setTxnError("");
    setTxnResult(null);
  }

  const toggleFactor = (key) => {
    setFactors((previous) => ({ ...previous, [key]: !previous[key] }));
    resetAnalysis();
  };

  const handleAmountChange = (event) => {
    const cleaned = event.target.value.replace(/[^\d,]/g, "");
    setAmount(cleaned);
    resetAnalysis();
  };

  const handleRecipientChange = (event) => {
    setRecipient(event.target.value);
    resetAnalysis();
  };

  const handleRecipientUPIChange = (event) => {
    setRecipientUPI(event.target.value);
    resetAnalysis();
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    resetAnalysis();
  };

  const handleAnalyze = () => {
    const trimmedRecipient = recipient.trim();
    const trimmedUPI = recipientUPI.trim();
    const numericAmount = Number(String(amount).replace(/,/g, ""));

    if (!trimmedRecipient && !trimmedUPI) {
      setAiStatus("input_error");
      setAiError("Enter a beneficiary name or UPI ID before starting protection.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setAiStatus("input_error");
      setAiError("Enter a valid payment amount before analyzing.");
      return;
    }

    if (!getAuthToken()) {
      setAiStatus("auth_required");
      setAiError("Sign in first - no auth token was found in this browser.");
      return;
    }

    const beneficiaryId = buildBeneficiaryId(trimmedUPI || trimmedRecipient, factors.newBeneficiary);
    const deviceId = buildDeviceId(factors.unknownDevice);

    const aiPayload = {
      amount: numericAmount,
      category,
      beneficiary_id: beneficiaryId,
      recipientUPI: trimmedUPI || null,
      device_id: deviceId,
      channel: "UPI",
      external_context: crossPlatformDemo ? [
        { source: "whatsapp", event: "Refund message received", text: "Your refund is ready. Send the requested payment to receive it.", demo: true },
        { source: "phone_call", event: "Caller pressure", text: "Caller asks the user to act immediately and complete the payment.", demo: true },
        { source: "payment", event: "UPI payment initiated", text: `₹${numericAmount.toLocaleString("en-IN")} to ${trimmedRecipient}`, demo: true }
      ] : [
        { source: "payment", event: "UPI payment initiated", text: `₹${numericAmount.toLocaleString("en-IN")} to ${trimmedRecipient}` }
      ],
    };

    setPendingPayment({
      ...aiPayload,
      recipientName: trimmedRecipient,
      isNewRecipient: factors.newBeneficiary,
      isNewDevice: factors.unknownDevice,
    });
    setFinalResult(null);
    setTxnStatus("idle");
    setTxnError("");
    setTxnResult(null);
    setAiError("");
    setAiStatus("waiting");

    // Hands off to ContextFusionMonitor, which runs Stage 1
    // (POST /api/ai/payment-initial), the optional Call Guard step, and the
    // final fused analysis (POST /api/ai/payment-analysis), then dispatches
    // window "contextfusion:payment:decision" once the user picks
    // Cancel / Proceed inside the monitor widget.
    emitPaymentInitiated(aiPayload);
  };

  async function handleConfirmPayment(statusOverride = "completed") {
    if (!finalResult || !pendingPayment) return;

    const token = getAuthToken();
    if (!token) {
      setTxnStatus("error");
      setTxnError("Sign in first - no auth token was found in this browser.");
      return;
    }

    setTxnStatus("submitting");
    setTxnError("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: pendingPayment.amount,
          type: pendingPayment.channel,
          recipientName: pendingPayment.recipientName || pendingPayment.recipientUPI,
          recipientUPI: pendingPayment.recipientUPI || null,
          category: pendingPayment.category,
          isNewRecipient: pendingPayment.isNewRecipient,
          deviceId: pendingPayment.device_id,
          isNewDevice: pendingPayment.isNewDevice,
          source: "app",
          status: statusOverride === "pending" ? "pending" : "completed",
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          (data && (data.message || data.error)) || `Transaction request failed (${response.status})`
        );
      }

      setTxnResult(data);
      setTxnStatus("success");
      // Return the user to the real transaction history after the success
      // confirmation, keeping the payment flow continuous.
      window.setTimeout(() => onNavigate?.("transactions"), 900);
    } catch (error) {
      setTxnStatus("error");
      setTxnError(error.message || "Could not create the transaction.");
    }
  }

  // finalResult is emitted automatically when the full AI pipeline finishes.
  // AI provides evidence and a score; it NEVER chooses the payment outcome.
  // The account holder makes the final choice: Pending or Approve.
  const decisionPayment = finalResult?.payment;

  // The main risk card reflects the current stage rather than staying at 0
  // until the final fusion. This makes Score #1 visible immediately after
  // Make Payment, then switches to Score #2, and finally to the fused score.
  const activeStage = aiStatus === "complete" && decisionPayment
    ? "final"
    : stageScores.call != null
      ? "call"
      : stageScores.initial != null
        ? "initial"
        : "idle";
  const activeScore = activeStage === "final"
    ? (stageScores.final ?? decisionPayment?.risk_score ?? 0)
    : activeStage === "call"
      ? stageScores.call
      : activeStage === "initial"
        ? stageScores.initial
        : 0;
  const activeLevel = activeStage === "idle"
    ? (aiStatus === "waiting" ? LEVEL_STYLES.ANALYZING : NOT_ANALYZED_STYLE)
    : levelFromScore(activeScore);
  const gauge = { score: activeScore ?? 0, ...activeLevel };

  const level = { label: gauge.label, color: gauge.color, soft: gauge.soft };
  const score = gauge.score;

  let riskDescription;
  if (aiStatus === "complete" && decisionPayment) {
    riskDescription =
      finalResult.decision === "cancel"
        ? "This payment was cancelled - no transaction will be created."
        : decisionPayment.ai_outcome === "PAYMENT_ALLOWED"
          ? "FraudShield AI found this payment consistent with your account's normal behavior."
          : "FraudShield AI flagged this payment for verification before it proceeds.";
  } else if (aiStatus === "waiting") {
    riskDescription = stageScores.initial != null && stageScores.call == null
      ? `Score #1 complete: ${Math.round(stageScores.initial)}/100. Call Guard is now ready for the next stage.`
      : stageScores.call != null
        ? `Score #2 complete: ${Math.round(stageScores.call)}/100. FraudShield is preparing the final merged verdict.`
        : "Analyzing your account history, payment amount, beneficiary and transaction context automatically.";
  } else if (aiStatus === "auth_required") {
    riskDescription = aiError;
  } else if (aiStatus === "error") {
    riskDescription = aiError || "The FraudShield AI analysis failed for this payment.";
  } else if (aiStatus === "input_error") {
    riskDescription = aiError;
  } else {
    riskDescription = "Enter the amount and beneficiary, then click Make Payment. FraudShield will automatically run account analysis, Call Guard and final risk fusion.";
  }

  const recTitle =
    aiStatus === "complete" && decisionPayment
      ? finalResult.decision === "cancel"
        ? "Payment cancelled."
        : decisionPayment.ai_outcome === "PAYMENT_ALLOWED"
          ? "This payment looks safe to proceed."
          : "This payment requires verification before proceeding."
      : "Click Make Payment to start the automatic first-stage AI analysis.";

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-mark">
          <ShieldCheck size={22} strokeWidth={2.4} />
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="nav-item"
                onClick={
                  item.label === "Dashboard"
                    ? onBack
                    : () => onNavigate?.(item.destination)
                }
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-badge">
            <ShieldCheck size={18} strokeWidth={2.2} />
          </div>
          <div className="footer-text">
            <div className="footer-title">Protection Active</div>
            <div className="footer-sub">All systems monitoring</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <button type="button" className="back-btn" onClick={onBack}>
            <ChevronLeft size={18} />
            Back to Dashboard
          </button>

          <div className="topbar-brand">
            <ShieldCheck size={20} strokeWidth={2.2} />
            <span>FraudShield</span>
          </div>

          <div className="topbar-right">
            <div className="protection-chip">
              <span className="dot" />
              <div>
                <div className="chip-title">Protection Active</div>
                <div className="chip-sub">Monitoring enabled</div>
              </div>
            </div>
            <div className="avatar">M</div>
          </div>
        </header>

        <main className="content">
          <div className="page-heading">
            <div className="page-icon">
              <ShieldCheck size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1>PAYMENT RISK ANALYZER</h1>
              <p>Test a transaction before it happens</p>
            </div>
          </div>

          <div className="grid-top">
            {/* TRANSACTION DETAILS */}
            <section className="card">
              <div className="card-header">
                <CreditCard size={16} />
                <span>TRANSACTION DETAILS</span>
              </div>

              <label className="field-label" htmlFor="payment-amount">Amount (₹)</label>
              <div className="input-row">
                <input
                  id="payment-amount"
                  className="text-input amount-input"
                  value={amount}
                  onChange={handleAmountChange}
                  inputMode="numeric"
                  placeholder="Enter amount"
                />
                <span className="input-suffix">
                  <IndianRupee size={16} />
                </span>
              </div>

              <label className="field-label" htmlFor="recipient-name">Recipient Name</label>
              <div className="input-row">
                <span className="input-prefix">
                  <User size={16} />
                </span>
                <input
                  id="recipient-name"
                  className="text-input recipient-input"
                  value={recipient}
                  onChange={handleRecipientChange}
                  placeholder="Enter recipient name"
                />
              </div>

              <label className="field-label" htmlFor="recipient-upi">Beneficiary UPI ID <span style={{fontWeight:600,textTransform:"none",color:"#9aa3b4"}}>optional</span></label>
              <div className="input-row">
                <span className="input-prefix">@</span>
                <input
                  id="recipient-upi"
                  className="text-input recipient-input"
                  value={recipientUPI}
                  onChange={handleRecipientUPIChange}
                  placeholder="e.g. name@upi"
                  autoComplete="off"
                />
              </div>

              <label className="field-label" htmlFor="payment-category">Category</label>
              <div className="input-row">
                <select
                  id="payment-category"
                  className="text-input"
                  value={category}
                  onChange={handleCategoryChange}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="risk-factors-label">PAYMENT CONTEXT</div>
              <div className="factor-list">
                {CONTEXT_TOGGLES.map((factor) => {
                  const Icon = factor.icon;
                  const checked = factors[factor.key];
                  return (
                    <div
                      key={factor.key}
                      className={`factor-row ${checked ? "selected" : ""}`}
                      onClick={() => toggleFactor(factor.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleFactor(factor.key);
                        }
                      }}
                    >
                      <span className="factor-icon">
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span className="factor-text">
                        <span className="factor-title">{factor.title}</span>
                        <span className="factor-subtitle">{factor.subtitle}</span>
                      </span>
                      <span className={`checkbox ${checked ? "checked" : ""}`}>
                        {checked && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path
                              d="M1 5L4.2 8.2L11 1"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => { setCrossPlatformDemo(v => !v); resetAnalysis(); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setCrossPlatformDemo(v => !v);
                    resetAnalysis();
                  }
                }}
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: crossPlatformDemo ? "1px solid #b8e6d5" : "1px solid #e4e8ef",
                  background: crossPlatformDemo ? "#f0faf6" : "#fafbfc",
                  cursor: "pointer",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start"
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 6, flex: "0 0 auto",
                  marginTop: 1, display: "grid", placeItems: "center",
                  background: crossPlatformDemo ? "#16865a" : "#fff",
                  border: crossPlatformDemo ? "1px solid #16865a" : "1px solid #cfd5df",
                  color: "#fff", fontSize: 12, fontWeight: 900
                }}>{crossPlatformDemo ? "✓" : ""}</span>
                <span>
                  <strong style={{display:"block",fontSize:12,color:"#273140"}}>Cross-platform context</strong>
                  <span style={{display:"block",fontSize:10,color:"#758093",lineHeight:1.45,marginTop:2}}>
                    Demo: WhatsApp refund message → phone-call pressure → UPI payment. This exposes scam chains that look normal when each channel is viewed alone.
                  </span>
                </span>
              </div>

              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={aiStatus === "waiting"}
              >
                <ShieldCheck size={17} strokeWidth={2.2} />
                {aiStatus === "waiting" ? "AI Protection Running..." : "Make Payment · Start AI Protection"}
              </button>

              {aiStatus === "waiting" && (
                <p style={{ fontSize: 12, color: "#7c8698", marginTop: 10 }}>
                  Score #1 is automatic. After it completes, the Call Guard stage is ready; the existing call controls can be used for the live/demo call, followed by Score #2 and final fusion.
                </p>
              )}

              {aiStatus === "input_error" && (
                <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 10 }}>{aiError}</p>
              )}

              {aiStatus === "auth_required" && (
                <p style={{ fontSize: 12, color: "#f43f5e", marginTop: 10 }}>{aiError}</p>
              )}
            </section>

            {/* RISK ANALYSIS */}
            <section className="card risk-card">
              <div className="card-header blue">
                <Activity size={16} />
                <span>REAL-TIME RISK ANALYSIS</span>
              </div>

              <div className="risk-main">
                <RiskGauge score={score} level={level} />
                <div className="risk-summary">
                  <div className="risk-level-label">RISK LEVEL</div>
                  <div className="risk-level-value" style={{ color: level.color }}>
                    <AlertTriangle size={20} />
                    {level.label}
                  </div>
                  <p className="risk-desc">{riskDescription}</p>

                  <div className="slider-track">
                    <div className="slider-gradient" />
                    <div
                      className="slider-thumb"
                      style={{ left: `${Math.min(Math.max(score, 0), 100)}%` }}
                    />
                  </div>
                  <div className="slider-labels">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:18}}>
                {[['#1','Account + Payment',stageScores.initial],['#2','Automatic Call Guard',stageScores.call],['#3','Final Fusion',stageScores.final]].map(([n,label,value])=><div key={n} style={{padding:"12px",border:"1px solid #e3e8f0",borderRadius:12,background:value==null?"#fafbfe":"#f4fbf7"}}><div style={{fontSize:10,fontWeight:900,color:"#6b7488"}}>{n} SCORE</div><strong style={{display:"block",fontSize:22,color:value==null?"#9aa3b4":"#16865a",marginTop:3}}>{value==null?"—":`${Math.round(value)}/100`}</strong><span style={{fontSize:10,color:"#788398"}}>{label}</span></div>)}
              </div>

              <div className="why-box">
                <div className="why-icon">
                  <ShieldCheck size={46} strokeWidth={1.3} />
                </div>
                <div>
                  <div className="why-title">
                    <ShieldCheck size={15} />
                    WHY THIS MATTERS
                  </div>
                  <p className="why-text">
                    Clicking Make Payment starts the complete AI pipeline automatically. Score #1 uses the account history, Score #2 uses automatic Call Guard, and the final score fuses transaction, beneficiary and cross-platform signals.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {aiStatus === "complete" && decisionPayment && !finalResult.decision && (
            <section
              ref={finalPanelRef}
              className="card"
              style={{ marginTop: 18, border: "1px solid #cfe3d9", boxShadow: "0 14px 35px rgba(22,134,90,.10)" }}
            >
              <div className="card-header green">
                <ShieldCheck size={17} />
                <span>3. FINAL PAYMENT VERDICT</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".06em", color: "#6b7488" }}>OVERALL FUSED RISK</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                    <strong style={{ fontSize: 42, lineHeight: 1, color: level.color }}>{Math.round(decisionPayment.risk_score ?? stageScores.final ?? 0)}%</strong>
                    <span style={{ fontSize: 13, fontWeight: 800, color: level.color }}>{decisionPayment.risk_level || "UNKNOWN"}</span>
                  </div>
                  <p style={{ margin: "10px 0 0", color: "#667085", fontSize: 13, lineHeight: 1.55 }}>
                    Score #1, Call Guard score, account behaviour, beneficiary signals and cross-platform context have been merged into this final verdict. The AI score is advisory; you decide what happens to the payment.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
                    <div style={{ padding: 11, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#6b7488", textTransform: "uppercase" }}>Payment Amount</div>
                      <div style={{ marginTop: 3, fontSize: 17, fontWeight: 900, color: "#172033" }}>{formatCurrency(decisionPayment.amount)}</div>
                    </div>
                    <div style={{ padding: 11, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#6b7488", textTransform: "uppercase" }}>Beneficiary</div>
                      <div style={{ marginTop: 3, fontSize: 14, fontWeight: 800, color: "#172033", wordBreak: "break-word" }}>{decisionPayment.recipientName || "Unknown recipient"}</div>
                      {decisionPayment.recipientUPI && <div style={{ marginTop: 2, fontSize: 11, color: "#667085" }}>{decisionPayment.recipientUPI}</div>}
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 230, padding: 14, borderRadius: 14, background: "#f6fbf8", border: "1px solid #dceee5" }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#6b7488", marginBottom: 8 }}>PAYMENT DECISION</div>
                  <div style={{ display: "grid", gap: 9 }}>
                    <button
                      type="button"
                      className="analyze-btn"
                      style={{ background: "#f2b84b", color: "#3a2a08" }}
                      disabled={txnStatus === "submitting"}
                      onClick={() => handleConfirmPayment("pending")}
                    >
                      <Activity size={17} strokeWidth={2.2} />
                      {txnStatus === "submitting" ? "Saving..." : "Keep in Pending Payments"}
                    </button>
                    <button
                      type="button"
                      className="analyze-btn"
                      style={{ background: "#238b62" }}
                      disabled={txnStatus === "submitting"}
                      onClick={() => handleConfirmPayment("completed")}
                    >
                      <ShieldCheck size={17} strokeWidth={2.2} />
                      {txnStatus === "submitting" ? "Saving..." : "Approve Payment"}
                    </button>
                  </div>
                </div>
              </div>
              {txnStatus === "error" && (
                <p style={{ fontSize: 12, color: "#f43f5e", margin: "12px 0 0" }}>{txnError}</p>
              )}
              {txnStatus === "success" && (
                <p style={{ fontSize: 13, color: "#16865a", margin: "12px 0 0", fontWeight: 700 }}>
                  Payment decision saved. Redirecting to Transactions…
                </p>
              )}
            </section>
          )}

          {/* BOTTOM GRID */}
          <div className="grid-bottom">
            <section className="card">
              <div className="card-header">
                <Info size={16} />
                <span>PAYMENT STATUS</span>
              </div>

              <div className="explain-list">
                {aiStatus !== "complete" && (
                  <div className="empty-explanation">
                    {aiStatus === "waiting"
                      ? "Waiting for the automatic FraudShield AI pipeline to finish..."
                      : "Click Make Payment to start the automatic AI protection pipeline."}
                  </div>
                )}
                {aiStatus === "complete" && decisionPayment && (
                  <div className="explain-row">
                    <span className="explain-delta">{decisionPayment.risk_score ?? "-"}/100</span>
                    <span className="explain-title">{decisionPayment.risk_level || "UNKNOWN"}</span>
                    <span className="explain-detail">
                      Status: Awaiting your decision · AI outcome: advisory only
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* RECOMMENDATION */}
            <section
              className={`card recommendation-card ${
                level.label === "LOW RISK"
                  ? "recommendation-low"
                  : level.label === "MEDIUM RISK"
                  ? "recommendation-medium"
                  : level.label === "HIGH RISK" || level.label === "CRITICAL RISK"
                    ? "recommendation-high"
                  : ""
              }`}
            >
              <div
                className={`card-header ${
                  level.label === "LOW RISK" ? "green" : level.label === "MEDIUM RISK" ? "yellow" : "red"
                }`}
              >
                <ShieldCheck size={16} />
                <span>RECOMMENDATION</span>
              </div>

              <h2 className="rec-title" style={{ color: level.color }}>
                {recTitle}
              </h2>

              {aiStatus === "complete" && decisionPayment && (decisionPayment.risk_score ?? 0) >= 35 && (
                <div style={{margin:"14px 0",padding:"16px",border:"1px solid #6b3b3b",borderRadius:14,background:"rgba(244,63,94,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}>
                    <div><strong style={{color:"#ff8b9c"}}>Before you continue, verify this request.</strong><div style={{fontSize:12,color:"#9aa4b5",marginTop:4}}>FraudShield detected signals that can occur when a user is being socially engineered.</div></div>
                    <button type="button" className="analyze-btn" onClick={()=>setSecondThought(v=>!v)} style={{whiteSpace:"nowrap"}}>{secondThought?"Hide check":"Second thought"}</button>
                  </div>
                  {secondThought && <div style={{marginTop:12,display:"grid",gap:8}}>
                    {[['asked','Did someone ask you to make this payment?'],['threatened','Did they say you would lose access to your account if you did not?'],['secrecy','Did they ask you not to tell anyone?']].map(([k,q])=><label key={k} style={{display:"flex",gap:9,alignItems:"center",fontSize:13,color:"#d6dbea"}}><input type="checkbox" checked={safetyAnswers[k]} onChange={e=>setSafetyAnswers(a=>({...a,[k]:e.target.checked}))}/>{q}</label>)}
                    {(safetyAnswers.asked||safetyAnswers.threatened||safetyAnswers.secrecy) && <div style={{color:"#ffb454",fontSize:12}}>These answers increase the reason to verify independently before sending money.</div>}
                  </div>}
                </div>
              )}

              {aiStatus === "complete" && decisionPayment && !finalResult.decision && (
                <p className="rec-sub">
                  The final verdict is ready. Use the Final Payment Verdict panel above to keep this payment pending or approve it.
                </p>
              )}

              {aiStatus === "complete" && finalResult.decision === "cancel" && (
                <p className="rec-sub">
                  You denied this payment. FraudShield will not authorize money movement.
                </p>
              )}

              <div className="rec-actions">
                <div className="rec-action">
                  <UserCheck size={22} strokeWidth={1.7} />
                  <span>Verify Recipient</span>
                </div>
                <div className="rec-action">
                  <ShieldCheck size={22} strokeWidth={1.7} />
                  <span>Trusted Contacts</span>
                </div>
                <div className="rec-action">
                  <Flag size={22} strokeWidth={1.7} />
                  <span>Report Suspicious</span>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}