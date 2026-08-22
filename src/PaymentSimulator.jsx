import React, { useMemo, useState } from "react";
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
  Clock,
  Gamepad2,
  Info,
  Flag,
  UserCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Dashboard" },
  { icon: CreditCard, label: "Transactions" },
  { icon: BrainCircuit, label: "Risk Analysis" },
  { icon: AlertTriangle, label: "Scam Intelligence" },
  { icon: Users, label: "Family Protection" },
  { icon: Bell, label: "Emergency Center" },
];

const RISK_FACTORS = [
  {
    key: "newBeneficiary",
    icon: User,
    title: "New Beneficiary",
    subtitle: "Recipient not in trusted list",
    weight: 25,
    impact: "High Impact",
    label: "New beneficiary",
    detail: "Recipient has not been trusted before",
  },
  {
    key: "unknownDevice",
    icon: Monitor,
    title: "Unknown Device",
    subtitle: "Device not recognized",
    weight: 20,
    impact: "High Impact",
    label: "Unknown device",
    detail: "Device isn't recognized in your account history",
  },
  {
    key: "unusualTime",
    icon: Clock,
    title: "Unusual Time",
    subtitle: "Transaction outside normal hours",
    weight: 15,
    impact: "Medium Impact",
    label: "Unusual time",
    detail: "Transaction attempted during off-peak hours",
  },
  {
    key: "gamingPayment",
    icon: Gamepad2,
    title: "Gaming Payment",
    subtitle: "Payment related to gaming",
    weight: 10,
    impact: "Medium Impact",
    label: "Gaming payment",
    detail: "Gaming payments are a high-risk category",
  },
];

function getRiskLevel(score) {
  if (score >= 70) {
    return {
      label: "HIGH RISK",
      color: "#f43f5e",
      soft: "rgba(244,63,94,0.12)",
    };
  }

  if (score >= 35) {
    return {
      label: "MEDIUM RISK",
      color: "#f59e0b",
      soft: "rgba(245,158,11,0.12)",
    };
  }

  return {
    label: "LOW RISK",
    color: "#22c55e",
    soft: "rgba(34,197,94,0.12)",
  };
}

function calculateAmountScore(amount) {
  const numericAmount = Number(String(amount).replace(/,/g, ""));

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  if (numericAmount >= 100000) return 35;
  if (numericAmount >= 50000) return 30;
  if (numericAmount >= 25000) return 25;
  if (numericAmount >= 10000) return 15;
  if (numericAmount >= 5000) return 8;

  return 0;
}

function formatCurrency(value) {
  const numericValue = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "₹0";
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
}

function RiskGauge({ score }) {
  const level = getRiskLevel(score);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(Math.max(score, 0), 100);
  const percentage = safeScore / 100;
  const dash = circumference * percentage;

  return (
    <div className="gauge-wrap">
      <svg
        className="risk-gauge-svg"
        width="220"
        height="220"
        viewBox="0 0 220 220"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#1b2333"
          strokeWidth="16"
        />

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
          style={{
            transition:
              "stroke-dasharray 0.6s ease, stroke 0.4s ease",
          }}
        />
      </svg>

      <div className="gauge-center">
        <div className="gauge-score">{safeScore}</div>
        <div className="gauge-max">/ 100</div>

        <div
          className="gauge-pill"
          style={{
            background: level.soft,
            color: level.color,
          }}
        >
          {level.label}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSimulator() {
  const [amount, setAmount] = useState("25,000");
  const [recipient, setRecipient] = useState("Rahul Kumar");

  const [factors, setFactors] = useState({
    newBeneficiary: true,
    unknownDevice: true,
    unusualTime: true,
    gamingPayment: true,
  });

  const [analyzed, setAnalyzed] = useState(true);

  const toggleFactor = (key) => {
    setFactors((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));

    setAnalyzed(false);
  };

  const activeFactors = useMemo(
    () => RISK_FACTORS.filter((factor) => factors[factor.key]),
    [factors]
  );

  const analysis = useMemo(() => {
    const amountScore = calculateAmountScore(amount);

    const factorScore = activeFactors.reduce(
      (total, factor) => total + factor.weight,
      0
    );

    const recipientScore =
      recipient.trim().length === 0 ? 10 : 0;

    const finalScore = Math.min(
      100,
      amountScore + factorScore + recipientScore
    );

    const level = getRiskLevel(finalScore);

    let recommendation;

    if (finalScore >= 70) {
      recommendation = "Do not proceed with this payment.";
    } else if (finalScore >= 35) {
      recommendation = "Proceed with caution.";
    } else {
      recommendation = "This payment looks safe to proceed.";
    }

    return {
      score: finalScore,
      level,
      amountScore,
      factorScore,
      recipientScore,
      recommendation,
    };
  }, [amount, recipient, activeFactors]);

  const score = analyzed ? analysis.score : 0;
  const level = getRiskLevel(score);

  const explainRows = [];

  if (analysis.amountScore > 0) {
    explainRows.push({
      delta: analysis.amountScore,
      title: "High transaction amount",
      detail: `${formatCurrency(amount)} is above your normal activity`,
    });
  }

  activeFactors.forEach((factor) => {
    explainRows.push({
      delta: factor.weight,
      title: factor.label,
      detail: factor.detail,
    });
  });

  if (analysis.recipientScore > 0) {
    explainRows.push({
      delta: analysis.recipientScore,
      title: "Recipient missing",
      detail: "A recipient name is required before payment",
    });
  }

  const handleAnalyze = () => {
    setAnalyzed(true);
  };

  const handleAmountChange = (event) => {
    const cleaned = event.target.value.replace(/[^\d,]/g, "");
    setAmount(cleaned);
    setAnalyzed(false);
  };

  const handleRecipientChange = (event) => {
    setRecipient(event.target.value);
    setAnalyzed(false);
  };

  const riskDescription =
    score >= 70
      ? "This transaction has multiple high-risk signals."
      : score >= 35
      ? "This transaction contains signals that require caution."
      : "This transaction currently shows few risk indicators.";

  const whyText =
    activeFactors.length >= 2
      ? "Multiple unusual signals have occurred together. This pattern can commonly appear in fraud attempts."
      : activeFactors.length === 1
      ? "One unusual signal was detected. Verify the transaction before proceeding."
      : "No additional risk signals are currently selected.";

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
                className={`nav-item ${
                  item.label === "Risk Analysis" ? "active" : ""
                }`}
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
            <div className="footer-title">
              Protection Active
            </div>

            <div className="footer-sub">
              All systems monitoring
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
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
                <div className="chip-title">
                  Protection Active
                </div>

                <div className="chip-sub">
                  Monitoring enabled
                </div>
              </div>
            </div>

            <div className="avatar">M</div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="content">

          {/* PAGE HEADING */}
          <div className="page-heading">

            <div className="page-icon">
              <ShieldCheck size={26} strokeWidth={2.2} />
            </div>

            <div>
              <h1>PAYMENT RISK ANALYZER</h1>

              <p>
                Test a transaction before it happens
              </p>
            </div>

          </div>

          {/* TOP GRID */}
          <div className="grid-top">

            {/* TRANSACTION DETAILS */}
            <section className="card">

              <div className="card-header">
                <CreditCard size={16} />
                <span>TRANSACTION DETAILS</span>
              </div>

              <label
                className="field-label"
                htmlFor="payment-amount"
              >
                Amount (₹)
              </label>

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

              <label
                className="field-label"
                htmlFor="recipient-name"
              >
                Recipient Name
              </label>

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

              <div className="risk-factors-label">
                RISK FACTORS TO SIMULATE
              </div>

              <div className="factor-list">

                {RISK_FACTORS.map((factor) => {
                  const Icon = factor.icon;
                  const checked = factors[factor.key];

                  return (
                    <div
                      key={factor.key}
                      className={`factor-row ${
                        checked ? "selected" : ""
                      }`}
                      onClick={() =>
                        toggleFactor(factor.key)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          toggleFactor(factor.key);
                        }
                      }}
                    >

                      <span className="factor-icon">
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                        />
                      </span>

                      <span className="factor-text">

                        <span className="factor-title">
                          {factor.title}
                        </span>

                        <span className="factor-subtitle">
                          {factor.subtitle}
                        </span>

                      </span>

                      <span
                        className={`checkbox ${
                          checked ? "checked" : ""
                        }`}
                      >
                        {checked && (
                          <svg
                            width="12"
                            height="10"
                            viewBox="0 0 12 10"
                            fill="none"
                          >
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
              >
                <ShieldCheck
                  size={17}
                  strokeWidth={2.2}
                />

                Analyze Payment
              </button>

            </section>

            {/* RISK ANALYSIS */}
            <section className="card risk-card">

              <div className="card-header blue">
                <Activity size={16} />
                <span>REAL-TIME RISK ANALYSIS</span>
              </div>

              <div className="risk-main">

                <RiskGauge score={score} />

                <div className="risk-summary">

                  <div className="risk-level-label">
                    RISK LEVEL
                  </div>

                  <div
                    className="risk-level-value"
                    style={{
                      color: level.color,
                    }}
                  >
                    <AlertTriangle size={20} />
                    {level.label}
                  </div>

                  <p className="risk-desc">
                    {riskDescription}

                    <br />

                    We recommend you{" "}

                    <strong
                      style={{
                        color:
                          level.label === "HIGH RISK"
                            ? "#f87171"
                            : level.label === "MEDIUM RISK"
                            ? "#f59e0b"
                            : "#22c55e",
                      }}
                    >
                      {level.label === "HIGH RISK"
                        ? "do not proceed"
                        : level.label === "MEDIUM RISK"
                        ? "verify before proceeding"
                        : "proceed with confidence"}
                    </strong>
                    .
                  </p>

                  <div className="slider-track">
                    <div className="slider-gradient" />

                    <div
                      className="slider-thumb"
                      style={{
                        left: `${Math.min(
                          Math.max(score, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="slider-labels">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>

                </div>

              </div>

              <div className="signals-label">
                RISK SIGNALS DETECTED
              </div>

              <div className="signals-grid">

                {activeFactors.length === 0 && (
                  <div className="no-signals">
                    No risk signals selected
                  </div>
                )}

                {activeFactors.map((factor) => {
                  const Icon = factor.icon;
                  const isHigh = factor.impact === "High Impact";
                  const signalColor = isHigh
                    ? "#f59e0b"
                    : "#60a5fa";

                  return (
                    <div
                      className="signal-item"
                      key={factor.key}
                    >

                      <span
                        className="signal-icon"
                        style={{
                          color: signalColor,
                        }}
                      >
                        <Icon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </span>

                      <div>

                        <div className="signal-title">
                          {factor.title}
                        </div>

                        <div
                          className="signal-impact"
                          style={{
                            color: signalColor,
                          }}
                        >
                          {factor.impact}
                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

              <div className="why-box">

                <div className="why-icon">
                  <ShieldCheck
                    size={46}
                    strokeWidth={1.3}
                  />
                </div>

                <div>

                  <div className="why-title">
                    <ShieldCheck size={15} />
                    WHY THIS MATTERS
                  </div>

                  <p className="why-text">
                    {whyText}
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* BOTTOM GRID */}
          <div className="grid-bottom">

            {/* EXPLAINABLE DECISION */}
            <section className="card">

              <div className="card-header">
                <Info size={16} />
                <span>EXPLAINABLE DECISION</span>
              </div>

              <div className="explain-list">

                {explainRows.length === 0 && (
                  <div className="empty-explanation">
                    No significant risk factors detected.
                  </div>
                )}

                {explainRows.map((row, index) => (
                  <div
                    className="explain-row"
                    key={`${row.title}-${index}`}
                  >
                    <span className="explain-delta">
                      +{row.delta}
                    </span>

                    <span className="explain-title">
                      {row.title}
                    </span>

                    <span className="explain-detail">
                      {row.detail}
                    </span>
                  </div>
                ))}

              </div>

            </section>

            {/* RECOMMENDATION */}
            <section
              className={`card recommendation-card ${
                level.label === "LOW RISK"
                  ? "recommendation-low"
                  : level.label === "MEDIUM RISK"
                  ? "recommendation-medium"
                  : ""
              }`}
            >

              <div
                className={`card-header ${
                  level.label === "LOW RISK"
                    ? "green"
                    : level.label === "MEDIUM RISK"
                    ? "yellow"
                    : "red"
                }`}
              >
                <ShieldCheck size={16} />
                <span>RECOMMENDATION</span>
              </div>

              <h2
                className="rec-title"
                style={{
                  color: level.color,
                }}
              >
                {analysis.recommendation}
              </h2>

              <p className="rec-sub">
                {level.label === "HIGH RISK"
                  ? "Verify the recipient and review the transaction before continuing."
                  : level.label === "MEDIUM RISK"
                  ? "Verify the recipient and transaction details before continuing."
                  : "The transaction currently shows a low level of simulated risk."}
              </p>

              <div className="rec-actions">

                <div className="rec-action">
                  <UserCheck
                    size={22}
                    strokeWidth={1.7}
                  />
                  <span>Verify Recipient</span>
                </div>

                <div className="rec-action">
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.7}
                  />
                  <span>Trusted Contacts</span>
                </div>

                <div className="rec-action">
                  <Flag
                    size={22}
                    strokeWidth={1.7}
                  />
                  <span>Report Suspicious</span>
                </div>

              </div>

              <div className="rec-fingerprint">

                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 140 140"
                  fill="none"
                >
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke={level.color}
                    strokeOpacity="0.15"
                    strokeWidth="1"
                  />

                  <circle
                    cx="70"
                    cy="70"
                    r="46"
                    stroke={level.color}
                    strokeOpacity="0.2"
                    strokeWidth="1"
                  />

                  <path
                    d="M70 30c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40Zm0 12c-15.5 0-28 12.5-28 28m6 20c-6-6-10-15-10-20m44 25c8-8 12-18 12-25 0-15.5-12.5-28-28-28m0 46c-10 0-18-8-18-18s8-18 18-18 18 8 18 18"
                    stroke={level.color}
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

              </div>

            </section>

          </div>

        </main>
      </div>
    </div>
  );
}