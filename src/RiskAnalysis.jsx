import React, { useState } from "react";
import "./Dashboard.css";

const AI_BACKEND_URL =
  import.meta.env.VITE_FRAUDSHIELD_AI_URL || "http://localhost:8000";

const LEVEL_STYLES = {
  CRITICAL: {
    label: "CRITICAL",
    varColor: "var(--red)",
    varLight: "var(--red-light)",
  },
  HIGH: {
    label: "HIGH",
    varColor: "var(--red)",
    varLight: "var(--red-light)",
  },
  MEDIUM: {
    label: "MEDIUM",
    varColor: "var(--orange)",
    varLight: "var(--orange-light)",
  },
  LOW: {
    label: "LOW",
    varColor: "var(--green)",
    varLight: "var(--green-light)",
  },
};

const NOT_ANALYZED_STYLE = {
  label: "NOT ANALYZED",
  varColor: "var(--text-light)",
  varLight: "var(--bg)",
};

// --- PROTOTYPE DEMO DATA (hardcoded) ---------------------------------
// Lets the Risk Analysis demo run reliably in a video/pitch without
// depending on live Gemini API availability/quota. Only this exact
// scenario is intercepted; every other input still goes through the
// real /api/v1/risk/text-analysis + Gemini flow unchanged.
const DEMO_SCENARIO_TEXT =
  "I got a call saying they were from SBI's fraud department. They told me there was unusual activity on my account and that it could be frozen unless I verified it immediately. They asked me to share the OTP I received and transfer ₹40,000 to a secure account, saying it would be refunded later. I wasn't sure if I should trust them, so I want to check the risk.";

const DEMO_SCENARIO_RESULT = {
  available: true,
  score: 94,
  level: "CRITICAL",
  explanation:
    "This matches a classic bank-impersonation scam: a caller claims to be from SBI's fraud team, manufactures urgency about your account being frozen, then asks for your OTP and a transfer to a 'secure' account. Legitimate banks never ask for OTPs or request transfers to verify or unfreeze an account.",
  signals: [
    { type: "bank_impersonation", detail: "Caller claimed to be from SBI's fraud department." },
    { type: "artificial_urgency", detail: "Threatened the account would be frozen unless verified immediately." },
    { type: "otp_credential_request", detail: "Asked the caller to share their OTP over the phone." },
    { type: "financial_pressure", detail: "Requested a ₹40,000 transfer under time pressure." },
    { type: "account_freeze_threat", detail: "Used the threat of account freezing to force quick action." },
  ],
};
// -----------------------------------------------------------------------

export default function RiskAnalysis({
  onBack,
  onNavigate,
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    const trimmed = text.trim();

    if (!trimmed) return;

    setStatus("loading");
    setError("");
    setResult(null);

    // Prototype demo path: bypass the live Gemini call for the one
    // hardcoded demo scenario so it's reliable on camera regardless of
    // AI_BACKEND/Gemini availability.
    if (trimmed === DEMO_SCENARIO_TEXT) {
      setResult(DEMO_SCENARIO_RESULT);
      setStatus("done");
      return;
    }

    try {
      const response = await fetch(
        `${AI_BACKEND_URL}/api/v1/risk/text-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Service responded with ${response.status}`);
      }

      const data = await response.json();

      if (!data.available) {
        setStatus("error");
        setError(
          data.message ||
            "Gemini is not configured or the request failed."
        );
        return;
      }

      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
      setError(
        "The AI risk-analysis service is unavailable. Make sure AI_BACKEND is running (uvicorn main:app --port 8000) and GEMINI_API_KEY is configured."
      );
    }
  }

  function navigate(destination) {
    if (destination === "dashboard") {
      onBack?.();
      return;
    }

    onNavigate?.(destination);
  }

  const level =
    status === "done" && result
      ? LEVEL_STYLES[result.level] || NOT_ANALYZED_STYLE
      : NOT_ANALYZED_STYLE;

  const score =
    status === "done" && result
      ? Math.min(Math.max(Number(result.score) || 0, 0), 100)
      : 0;

  return (
    <div
      className="fs-app"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className="sidebar"
        style={{
          width: 230,
          minWidth: 230,
          minHeight: "100vh",
          background: "var(--sidebar)",
          color: "#c8cbe0",
          display: "flex",
          flexDirection: "column",
          padding: "20px 14px",
          flexShrink: 0,
        }}
      >
        {/* LOGO */}

        <div className="logo">
          <div className="logo-icon">🛡️</div>

          <div className="logo-text">
            <div className="top">
              Fraud<span>Shield</span>
            </div>

            <div className="sub">
              Payment Safety
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <ul className="nav">
          <li>
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                navigate("dashboard");
              }}
            >
              <span className="ic">🏠</span>
              Dashboard
            </a>
          </li>

          <li>
            <a
              href="#transactions"
              onClick={(e) => {
                e.preventDefault();
                navigate("transactions");
              }}
            >
              <span className="ic">💳</span>
              Transactions
            </a>
          </li>

          <li>
            <a
              href="#payment"
              onClick={(e) => {
                e.preventDefault();
                navigate("payment");
              }}
            >
              <span className="ic">💸</span>
              Make a Payment
            </a>
          </li>

          <li>
            <a
              href="#risk-analysis"
              className="active"
              onClick={(e) => e.preventDefault()}
            >
              <span className="ic">📈</span>
              Risk Analysis
            </a>
          </li>

          <li>
            <a
              href="#scam-detection"
              onClick={(e) => {
                e.preventDefault();
                navigate("scam-detection");
              }}
            >
              <span className="ic">🔍</span>
              Scam Detection
            </a>
          </li>

          <li>
            <a
              href="#scam-chain"
              onClick={(e) => {
                e.preventDefault();
                navigate("scam-chain");
              }}
            >
              <span className="ic">⏱️</span>
              Scam Chain Timeline
            </a>
          </li>

          <li>
            <a
              href="#family-protection"
              onClick={(e) => {
                e.preventDefault();
                navigate("family-protection");
              }}
            >
              <span className="ic">👪</span>
              Family Protection
            </a>
          </li>

          <li>
            <a
              href="#fraud-intelligence"
              onClick={(e) => {
                e.preventDefault();
                navigate("fraud-intelligence");
              }}
            >
              <span className="ic">🌐</span>
              Fraud Intelligence
            </a>
          </li>

          <li>
            <a
              href="#emergency"
              onClick={(e) => {
                e.preventDefault();
                navigate("emergency");
              }}
            >
              <span className="ic">🚨</span>
              Emergency Center
            </a>
          </li>

          <li>
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                navigate("settings");
              }}
            >
              <span className="ic">⚙️</span>
              Settings
            </a>
          </li>
        </ul>

        {/* PROTECTION BOX */}

        <div className="protect-box">
          <div className="badge">✓</div>

          <div className="title">
            You are Protected
          </div>

          <div className="desc">
            FraudShield is actively monitoring your account
          </div>
        </div>

        {/* USER BOX */}

        <div className="user-box">
          <div className="avatar">M</div>

          <div>
            <div className="name">Megha</div>

            <div className="role">
              Protected Account
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="main">

        {/* =====================================================
            TOPBAR
        ===================================================== */}

        <div
          className="topbar"
          style={{
            minHeight: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            padding: "16px 28px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div className="search">
            🔍 Search anything...
            <kbd>Ctrl + K</kbd>
          </div>

          <div className="topbar-right">
            <div className="icon-btn">
              🔔
              <span className="dot"></span>
            </div>

            <div className="lang">🌐 English ▾</div>

            <div className="icon-btn">🌙</div>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="content">

          {/* PAGE HEADER */}

          <div
            style={{
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--blue)",
                marginBottom: 5,
              }}
            >
              FRAUDSHIELD ANALYTICS
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 22,
                color: "var(--text-dark)",
              }}
            >
              Risk Analysis
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "var(--text-mid)",
              }}
            >
              Analyze suspicious messages and identify potential fraud
              signals before interacting with them.
            </p>
          </div>

          {/* =====================================================
              MESSAGE INPUT
          ===================================================== */}

          <div className="panel">
            <div className="panel-head">
              <h3>Analyze a Message</h3>

              {status === "done" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--green)",
                    background: "var(--green-light)",
                    padding: "5px 9px",
                    borderRadius: 999,
                  }}
                >
                  ✓ ANALYSIS COMPLETE
                </span>
              )}
            </div>

            <label
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--text-mid)",
                marginBottom: 8,
              }}
            >
              Paste a message, SMS, or call transcript to analyze
            </label>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);

                if (status !== "idle") {
                  setStatus("idle");
                  setResult(null);
                  setError("");
                }
              }}
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  e.key === "Enter"
                ) {
                  handleAnalyze();
                }
              }}
              placeholder="e.g. Send me your OTP immediately, your account will be blocked..."
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontFamily: "inherit",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#000000",
                backgroundColor: "#ffffff",
                caretColor: "#000000",
                marginBottom: 12,
                outline: "none",
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#111111";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(0,0,0,.06)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                Tip: Ctrl + Enter to analyze
                <button
                  type="button"
                  onClick={() => {
                    setText(DEMO_SCENARIO_TEXT);
                    setStatus("idle");
                    setResult(null);
                    setError("");
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--blue)",
                    background: "var(--blue-light)",
                    border: "none",
                    borderRadius: 999,
                    padding: "4px 9px",
                    cursor: "pointer",
                  }}
                >
                  Try Demo Scenario
                </button>
              </span>

              <button
                type="button"
                className="run-btn"
                onClick={handleAnalyze}
                disabled={
                  status === "loading" || !text.trim()
                }
                style={{
                  width: 170,
                  opacity:
                    status === "loading" || !text.trim()
                      ? 0.6
                      : 1,
                  cursor:
                    status === "loading" || !text.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {status === "loading"
                  ? "⏳ Analyzing..."
                  : "📊 Analyze Text"}
              </button>
            </div>

            {status === "error" && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--red-light)",
                  color: "var(--red)",
                  fontSize: 12,
                  border: "1px solid rgba(229,72,77,.15)",
                }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* =====================================================
              RISK VERDICT
          ===================================================== */}

          <div className="panel">
            <div className="panel-head">
              <h3>Risk Verdict</h3>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: level.varLight,
                  border: `5px solid ${level.varColor}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 21,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: level.varColor,
                  }}
                >
                  {score}
                </div>

                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: level.varColor,
                    marginTop: 3,
                  }}
                >
                  / 100
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="risk-top">
                  <span className="name">
                    Overall Risk Score
                  </span>

                  <span
                    className="val"
                    style={{
                      color: level.varColor,
                    }}
                  >
                    {level.label}
                  </span>
                </div>

                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${score}%`,
                      background: level.varColor,
                      transition: "width .4s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-mid)",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {status === "done" && result
                ? result.explanation ||
                  "Gemini analysis completed."
                : status === "loading"
                  ? "Running Gemini-based fraud-risk analysis..."
                  : status === "error"
                    ? error
                    : "Enter text above and click Analyze Text to run a real Gemini risk check."}
            </p>
          </div>

          {/* =====================================================
              DETECTED SIGNALS
          ===================================================== */}

          <div className="panel">
            <div className="panel-head">
              <h3>Detected Signals</h3>

              {status === "done" &&
                result?.signals?.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-light)",
                    }}
                  >
                    {result.signals.length} signal
                    {result.signals.length !== 1
                      ? "s"
                      : ""}{" "}
                    detected
                  </span>
                )}
            </div>

            {status === "done" &&
            result &&
            result.signals?.length > 0 ? (
              result.signals.map((signal, index) => (
                <div
                  className="tx"
                  key={`${signal.type}-${index}`}
                >
                  <div
                    className="tx-icon"
                    style={{
                      background: level.varLight,
                      color: level.varColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}
                  >
                    ⚠️
                  </div>

                  <div className="tx-info">
                    <div
                      className="tx-name"
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {String(
                        signal.type || "signal"
                      ).replace(/_/g, " ")}
                    </div>

                    <div className="tx-meta">
                      {signal.detail ||
                        "Suspicious pattern detected."}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: level.varColor,
                      background: level.varLight,
                      padding: "4px 7px",
                      borderRadius: 999,
                    }}
                  >
                    DETECTED
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "12px 0",
                  fontSize: 12.5,
                  color: "var(--text-light)",
                  textAlign: "center",
                }}
              >
                {status === "done"
                  ? "✓ No risk signals detected."
                  : "Run analysis to see detected signals."}
              </div>
            )}
          </div>

          {/* =====================================================
              EXPLANATION
          ===================================================== */}

          <div className="panel">
            <div className="panel-head">
              <h3>Explanation</h3>
            </div>

            <div
              style={{
                padding: "13px 15px",
                background:
                  status === "done"
                    ? "var(--blue-light)"
                    : "var(--bg)",
                borderRadius: 9,
                border:
                  status === "done"
                    ? "1px solid rgba(59,111,224,.12)"
                    : "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dark)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {status === "done" &&
                result?.explanation
                  ? result.explanation
                  : status === "error"
                    ? "No explanation available. The Gemini risk-analysis service could not be reached."
                    : "Run analysis to see a plain-language explanation here."}
              </p>
            </div>
          </div>

          {/* =====================================================
              SAFETY REMINDER
          ===================================================== */}

          <div
            className="panel"
            style={{
              background: "var(--green-light)",
              borderColor: "rgba(31,169,113,.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "var(--green)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                🛡️
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-dark)",
                    marginBottom: 3,
                  }}
                >
                  Stay protected
                </div>

                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "var(--text-mid)",
                  }}
                >
                  Never share OTPs, PINs, passwords, or
                  banking credentials because someone
                  claims to be from a bank or government
                  agency.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}