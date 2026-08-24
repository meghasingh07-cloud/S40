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

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard" },
  { icon: CreditCard, label: "Transactions" },
  { icon: BrainCircuit, label: "Risk Analysis" },
  { icon: AlertTriangle, label: "Scam Intelligence" },
  { icon: Users, label: "Family Protection" },
  { icon: Bell, label: "Emergency Center" },
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

export default function PaymentSimulator() {
  const [amount, setAmount] = useState("25,000");
  const [recipient, setRecipient] = useState("Rahul Kumar");
  const [category, setCategory] = useState("other");

  const [factors, setFactors] = useState({
    newBeneficiary: true,
    unknownDevice: true,
  });

  // "idle" | "input_error" | "auth_required" | "waiting" | "complete" | "error"
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiError, setAiError] = useState("");
  const [pendingPayment, setPendingPayment] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  // "idle" | "submitting" | "success" | "error"
  const [txnStatus, setTxnStatus] = useState("idle");
  const [txnError, setTxnError] = useState("");
  const [txnResult, setTxnResult] = useState(null);

  // ContextFusionMonitor (mounted once at the App root) owns the actual
  // payment-initial / Call Guard / payment-analysis calls, and broadcasts
  // its result on the real window event "contextfusion:payment:decision".
  // This component only ever (a) tells it a payment started via
  // emitPaymentInitiated, and (b) listens on window for that decision. It
  // never calls /api/ai/* directly.
  useEffect(() => {
    function handleDecision(e) {
      const detail = e.detail || {};
      // ContextFusionMonitor's decide() sends { decision, payment: {...} }.
      // payment carries risk_score / risk_level / ai_outcome / status,
      // alongside everything we originally sent it in emitPaymentInitiated.
      setFinalResult(detail);
      setAiStatus("complete");
    }
    window.addEventListener("contextfusion:payment:decision", handleDecision);
    return () => window.removeEventListener("contextfusion:payment:decision", handleDecision);
  }, []);

  function resetAnalysis() {
    setAiStatus("idle");
    setAiError("");
    setPendingPayment(null);
    setFinalResult(null);
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

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    resetAnalysis();
  };

  const handleAnalyze = () => {
    const trimmedRecipient = recipient.trim();
    const numericAmount = Number(String(amount).replace(/,/g, ""));

    if (!trimmedRecipient) {
      setAiStatus("input_error");
      setAiError("Enter a recipient name before analyzing.");
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

    const beneficiaryId = buildBeneficiaryId(trimmedRecipient, factors.newBeneficiary);
    const deviceId = buildDeviceId(factors.unknownDevice);

    const aiPayload = {
      amount: numericAmount,
      category,
      beneficiary_id: beneficiaryId,
      device_id: deviceId,
      channel: "UPI",
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

  async function handleConfirmPayment() {
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
          recipientName: pendingPayment.recipientName,
          category: pendingPayment.category,
          isNewRecipient: pendingPayment.isNewRecipient,
          deviceId: pendingPayment.device_id,
          isNewDevice: pendingPayment.isNewDevice,
          source: "app",
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
    } catch (error) {
      setTxnStatus("error");
      setTxnError(error.message || "Could not create the transaction.");
    }
  }

  // finalResult here is the payload from ContextFusionMonitor's decide():
  // { decision: "continue"|"cancel", payment: { ...pendingPayment, risk_score, risk_level, status, ai_outcome } }
  const decisionPayment = finalResult?.payment;

  const gauge =
    aiStatus === "complete" && decisionPayment
      ? {
        score: decisionPayment.risk_score ?? 0,
        ...(LEVEL_STYLES[decisionPayment.risk_level] || NOT_ANALYZED_STYLE),
      }
      : aiStatus === "waiting"
        ? { score: 0, ...LEVEL_STYLES.ANALYZING }
        : { score: 0, ...NOT_ANALYZED_STYLE };

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
    riskDescription =
      "Running real-time behavioural, network and Call Guard checks on this payment. Watch the FraudShield AI widget in the corner for live progress.";
  } else if (aiStatus === "auth_required") {
    riskDescription = aiError;
  } else if (aiStatus === "error") {
    riskDescription = aiError || "The FraudShield AI analysis failed for this payment.";
  } else if (aiStatus === "input_error") {
    riskDescription = aiError;
  } else {
    riskDescription = "Enter payment details and click Analyze Payment to run a real FraudShield AI risk check.";
  }

  const recTitle =
    aiStatus === "complete" && decisionPayment
      ? finalResult.decision === "cancel"
        ? "Payment cancelled."
        : decisionPayment.ai_outcome === "PAYMENT_ALLOWED"
          ? "This payment looks safe to proceed."
          : "This payment requires verification before proceeding."
      : "Run the analysis to get a recommendation.";

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
                className={`nav-item ${item.label === "Risk Analysis" ? "active" : ""}`}
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
          <button type="button" className="back-btn">
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

              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={aiStatus === "waiting"}
              >
                <ShieldCheck size={17} strokeWidth={2.2} />
                {aiStatus === "waiting" ? "Analyzing..." : "Analyze Payment"}
              </button>

              {aiStatus === "waiting" && (
                <p style={{ fontSize: 12, color: "#7c8698", marginTop: 10 }}>
                  Watch the FraudShield AI widget in the bottom-right corner for live progress,
                  including the optional Call Guard step - it decides when the final analysis runs
                  and where you confirm or cancel the payment.
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
                    This screen hands off to the FraudShield AI widget for the actual behavioural,
                    network and Call Guard analysis - open it (bottom-right) to see live signals,
                    risk dimensions, and the explainable breakdown for this payment.
                  </p>
                </div>
              </div>
            </section>
          </div>

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
                      ? "Waiting for the FraudShield AI widget to finish its staged analysis..."
                      : "Run the analysis to see the payment outcome here."}
                  </div>
                )}
                {aiStatus === "complete" && decisionPayment && (
                  <div className="explain-row">
                    <span className="explain-delta">{decisionPayment.risk_score ?? "-"}/100</span>
                    <span className="explain-title">{decisionPayment.risk_level || "UNKNOWN"}</span>
                    <span className="explain-detail">
                      Status: {decisionPayment.status} (AI outcome: {decisionPayment.ai_outcome})
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

              {aiStatus === "complete" && decisionPayment && finalResult.decision === "continue" && (
                <div style={{ margin: "14px 0" }}>
                  <p style={{ fontSize: 13, color: "#9aa4b5", marginBottom: 10 }}>
                    Sending {formatCurrency(pendingPayment?.amount)} to{" "}
                    {pendingPayment?.recipientName || "recipient"}
                    {" - "}
                    {decisionPayment.ai_outcome === "PAYMENT_ALLOWED"
                      ? "no approval flag from FraudShield AI."
                      : "flagged for verification by FraudShield AI."}
                  </p>

                  {txnStatus === "success" ? (
                    <p style={{ fontSize: 13, color: "#22c55e" }}>
                      Transaction created ({txnResult?.transaction?.riskLevel ?? "—"} risk,{" "}
                      {txnResult?.transaction?.riskScore ?? "—"}/100 from the existing transaction risk
                      engine).
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="analyze-btn"
                        style={decisionPayment.ai_outcome !== "PAYMENT_ALLOWED" ? { background: "#f43f5e" } : undefined}
                        disabled={txnStatus === "submitting"}
                        onClick={handleConfirmPayment}
                      >
                        <ShieldCheck size={17} strokeWidth={2.2} />
                        {txnStatus === "submitting"
                          ? "Sending..."
                          : decisionPayment.ai_outcome !== "PAYMENT_ALLOWED"
                            ? "Proceed Anyway (Flagged)"
                            : "Confirm & Send Payment"}
                      </button>

                      {txnStatus === "error" && (
                        <p style={{ fontSize: 12, color: "#f43f5e", marginTop: 8 }}>{txnError}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {aiStatus === "complete" && finalResult.decision === "cancel" && (
                <p className="rec-sub">
                  You cancelled this payment from the FraudShield AI widget - no transaction was created.
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