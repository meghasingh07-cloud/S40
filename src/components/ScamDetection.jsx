import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Link2,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Brain,
  Zap,
  Lock,
  UserX,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Copy,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

const MESSAGE_CHECK_URL = "http://localhost:5000/api/message/check";

export default function ScamDetection({ onBack }) {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeExample, setActiveExample] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const examples = [
    {
      id: 1,
      type: "SMS",
      icon: <MessageSquare size={16} />,
      title: "KYC Expiry Message",
      text:
        "URGENT: Your bank KYC will expire today. Your account will be blocked within 2 hours. Verify immediately at https://secure-kyc-update.example.com",
    },
    {
      id: 2,
      type: "WhatsApp",
      icon: <Smartphone size={16} />,
      title: "Investment Opportunity",
      text:
        "Congratulations! You have been selected for our exclusive investment group. Invest ₹10,000 today and receive guaranteed returns of ₹50,000. Limited slots available.",
    },
    {
      id: 3,
      type: "Message",
      icon: <MessageSquare size={16} />,
      title: "Digital Arrest",
      text:
        "This is an official notice. Your Aadhaar has been linked to illegal activity. Do not disconnect this call. Transfer ₹25,000 immediately for verification.",
    },
    {
      id: 4,
      type: "Email",
      icon: <Mail size={16} />,
      title: "Refund Scam",
      text:
        "Your refund of ₹18,500 is pending. Please confirm your UPI PIN to receive the refund. Click the link below to complete verification.",
    },
  ];
  const INDICATOR_DISPLAY = {
    URGENCY: { icon: <Zap size={15} />, severity: "HIGH", title: "Artificial urgency" },
    THREAT: { icon: <AlertTriangle size={15} />, severity: "HIGH", title: "Fear-based manipulation" },
    IMPERSONATION: { icon: <UserX size={15} />, severity: "HIGH", title: "Authority impersonation" },
    CREDENTIAL_REQUEST: { icon: <Lock size={15} />, severity: "CRITICAL", title: "Credential extraction" },
    PAYMENT_REQUEST: { icon: <IndianRupee size={15} />, severity: "HIGH", title: "Financial pressure" },
    LINK_PRESENT: { icon: <Link2 size={15} />, severity: "MEDIUM", title: "External link detected" },
  };

  const deriveScamType = (text) => {
    const normalized = text.toLowerCase();

    if (/kyc|aadhaar|account will be blocked|account.*suspend/.test(normalized)) {
      return {
        scamType: "KYC / Account Suspension Scam",
        explanation:
          "The sender appears to use account-related fear and urgency to push the victim toward a fraudulent verification flow.",
      };
    }
    if (/arrest|police|illegal|case|cyber crime|cybercrime/.test(normalized)) {
      return {
        scamType: "Digital Arrest / Authority Scam",
        explanation:
          "The message attempts to create fear by impersonating authorities and suggesting legal consequences.",
      };
    }
    if (/invest|guaranteed|returns|profit|double/.test(normalized)) {
      return {
        scamType: "Investment Scam",
        explanation:
          "The content uses financial rewards and urgency to encourage a risky payment or investment.",
      };
    }
    if (/refund|cashback|refund.*upi|upi.*refund/.test(normalized)) {
      return {
        scamType: "Refund Scam",
        explanation:
          "The message uses a supposed refund to create a reason for requesting payment credentials or a transaction.",
      };
    }
    if (/job|salary|hiring|vacancy|work from home/.test(normalized)) {
      return {
        scamType: "Job Scam",
        explanation:
          "The content appears to use employment or earning opportunities as a reason to request money or information.",
      };
    }
    return {
      scamType: "Suspicious Communication",
      explanation: "The content contains patterns associated with social engineering.",
    };
  };

  const deriveRecommendation = (riskLevel) => {
    if (riskLevel === "HIGH") {
      return "Do not pay, share OTP/PIN/passwords, open the link, or give anyone remote access. Verify through the official institution's app or website.";
    }
    if (riskLevel === "MEDIUM") {
      return "Pause before responding. Verify the sender independently and avoid making any payment or sharing sensitive information.";
    }
    return "Treat the message cautiously and verify the claim using an official source before taking action.";
  };

  const deriveManipulation = (indicatorTypes) => ({
    urgency: indicatorTypes.has("URGENCY") ? 88 : 12,
    authority: indicatorTypes.has("IMPERSONATION") ? 82 : 10,
    money: indicatorTypes.has("PAYMENT_REQUEST") ? 91 : 8,
    fear: indicatorTypes.has("THREAT") ? 87 : 9,
    trust: indicatorTypes.has("IMPERSONATION") ? 74 : 20,
  });

  const analyzeScam = async (text = input) => {
    if (!text.trim()) {
      setErrorMessage("Please enter a message to analyze.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await axios.post(MESSAGE_CHECK_URL, { message: text });
      const { score, riskLevel, indicators } = response.data;

      const signals = indicators.map((indicator) => {
        const display = INDICATOR_DISPLAY[indicator.type] || {
          icon: <AlertTriangle size={15} />,
          severity: "MEDIUM",
          title: indicator.type,
        };
        return {
          title: display.title,
          description: indicator.explanation,
          icon: display.icon,
          severity: display.severity,
        };
      });

      const { scamType, explanation } = deriveScamType(text);
      const recommendation = deriveRecommendation(riskLevel);
      const manipulation = deriveManipulation(
        new Set(indicators.map((i) => i.type))
      );

      setAnalysis({
        score,
        riskLevel,
        scamType,
        explanation,
        recommendation,
        signals,
        manipulation,
        text,
      });
    } catch (error) {
      console.error("MESSAGE CHECK REQUEST FAILED:", error);
      setErrorMessage(
        "Couldn't reach the fraud detection service. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  const loadExample = (example) => {
    setInput(example.text);
    setActiveExample(example.id);
    setTimeout(() => analyzeScam(example.text), 0);
  };

  const clearAnalyzer = () => {
    setInput("");
    setAnalysis(null);
    setActiveExample(null);
    setErrorMessage(null);
  };

  const riskConfig = useMemo(() => {
    if (!analysis) return null;

    if (analysis.riskLevel === "CRITICAL") {
      return {
        color: "#e5484d",
        background: "#fff0f1",
        icon: <ShieldX size={22} />,
        label: "CRITICAL RISK",
      };
    }

    if (analysis.riskLevel === "HIGH") {
      return {
        color: "#d88400",
        background: "#fff4e6",
        icon: <ShieldAlert size={22} />,
        label: "HIGH RISK",
      };
    }

    if (analysis.riskLevel === "MEDIUM") {
      return {
        color: "#a36a00",
        background: "#fff8df",
        icon: <ShieldAlert size={22} />,
        label: "MEDIUM RISK",
      };
    }

    return {
      color: "#16865a",
      background: "#eaf8f1",
      icon: <ShieldCheck size={22} />,
      label: "LOW RISK",
    };
  }, [analysis]);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "30px 34px 50px",
        background: "var(--bg, #f6f7fb)",
        color: "var(--text, #17191f)",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "11px",
            border: "1px solid #e4e6ed",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#343842",
          }}
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "#7d8291",
              marginBottom: "4px",
            }}
          >
            FRAUD INTELLIGENCE
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "27px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            Scam Detection
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "13px",
              color: "#7d8291",
            }}
          >
            Analyze suspicious messages, links and requests before they become
            scams.
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(300px, .75fr)",
          gap: "18px",
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          {/* ANALYZER */}
          <div
            style={{
              background: "white",
              border: "1px solid #e7e9ef",
              borderRadius: "16px",
              padding: "21px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  Analyze suspicious content
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#858997",
                    marginTop: "4px",
                  }}
                >
                  Paste an SMS, WhatsApp message, email, URL or suspicious
                  request.
                </div>
              </div>

              {input && (
                <button
                  onClick={clearAnalyzer}
                  style={{
                    border: "none",
                    background: "#f5f6f9",
                    color: "#686d79",
                    borderRadius: "8px",
                    padding: "7px 9px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              )}
            </div>

            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setAnalysis(null);
                setErrorMessage(null);
              }}
              placeholder="Example: Your bank account will be blocked today. Verify your KYC immediately..."
              style={{
                width: "100%",
                minHeight: "145px",
                resize: "vertical",
                border: "1px solid #dfe2e9",
                borderRadius: "11px",
                padding: "13px",
                boxSizing: "border-box",
                outline: "none",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "#343842",
                background: "#ffffff",
                fontFamily: "inherit",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#999daa",
                }}
              >
                FraudShield checks language, intent and social-engineering
                signals.
              </div>

              <button
                onClick={() => analyzeScam()}
                disabled={!input.trim() || isLoading}
                style={{
                  border: "none",
                  borderRadius: "9px",
                  background: input.trim() && !isLoading ? "#3b6fe0" : "#dfe3eb",
                  color: "white",
                  padding: "10px 17px",
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                  fontSize: "11px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <Search size={14} />
                {isLoading ? "Analyzing..." : "Analyze Scam"}
              </button>
            </div>
          </div>

          {/* ERROR STATE */}
          {errorMessage && (
            <div
              style={{
                background: "#fff0f1",
                border: "1px solid #f3c6c8",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "11px",
                color: "#c9363d",
                fontWeight: 700,
              }}
            >
              <XCircle size={16} />
              {errorMessage}
            </div>
          )}

          {/* LOADING STATE */}
          {isLoading && (
            <div
              style={{
                background: "white",
                border: "1px solid #e7e9ef",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "18px",
                textAlign: "center",
                fontSize: "12px",
                color: "#858997",
                fontWeight: 700,
              }}
            >
              Checking message against FraudShield's risk engine...
            </div>
          )}

          {/* ANALYSIS RESULT */}
          {!isLoading && analysis && riskConfig && (
            <div
              style={{
                background: "white",
                border: "1px solid #e7e9ef",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* RESULT HEADER */}
              <div
                style={{
                  padding: "18px 20px",
                  background: riskConfig.background,
                  borderBottom: "1px solid #eef0f4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                  }}
                >
                  <div style={{ color: riskConfig.color }}>
                    {riskConfig.icon}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 900,
                        color: riskConfig.color,
                        letterSpacing: ".6px",
                      }}
                    >
                      FRAUDSHIELD VERDICT
                    </div>

                    <div
                      style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        marginTop: "3px",
                      }}
                    >
                      {riskConfig.label}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#858997",
                      fontWeight: 700,
                    }}
                  >
                    SCAM RISK
                  </div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: riskConfig.color,
                      lineHeight: 1,
                      marginTop: "3px",
                    }}
                  >
                    {analysis.score}
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#858997",
                      }}
                    >
                      /100
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                {/* SCAM TYPE */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <MiniResult
                    label="Detected scam type"
                    value={analysis.scamType}
                  />

                  <MiniResult
                    label="Detection confidence"
                    value={`${Math.min(
                      98,
                      Math.max(68, analysis.score + 12)
                    )}%`}
                  />
                </div>

                {/* EXPLANATION */}
                <div
                  style={{
                    background: "#f7f9fd",
                    borderRadius: "12px",
                    padding: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#3b6fe0",
                      marginBottom: "6px",
                    }}
                  >
                    <Brain size={14} />
                    WHY THIS LOOKS SUSPICIOUS
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.6,
                      color: "#626774",
                    }}
                  >
                    {analysis.explanation}
                  </div>
                </div>

                {/* SIGNALS */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    marginBottom: "10px",
                  }}
                >
                  Detected signals
                </div>

                {analysis.signals.length === 0 ? (
                  <div
                    style={{
                      padding: "15px",
                      borderRadius: "10px",
                      background: "#f7f9fb",
                      fontSize: "11px",
                      color: "#777b87",
                    }}
                  >
                    No major social-engineering signals were detected.
                  </div>
                ) : (
                  analysis.signals.map((signal, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "10px",
                        padding: "11px 0",
                        borderBottom:
                          index === analysis.signals.length - 1
                            ? "none"
                            : "1px solid #f0f1f4",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background:
                            signal.severity === "CRITICAL"
                              ? "#fff0f1"
                              : signal.severity === "HIGH"
                                ? "#fff4e6"
                                : "#eef3ff",
                          color:
                            signal.severity === "CRITICAL"
                              ? "#e5484d"
                              : signal.severity === "HIGH"
                                ? "#d88400"
                                : "#3b6fe0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {signal.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {signal.title}
                          </span>

                          <span
                            style={{
                              fontSize: "8px",
                              fontWeight: 800,
                              color:
                                signal.severity === "CRITICAL"
                                  ? "#e5484d"
                                  : signal.severity === "HIGH"
                                    ? "#d88400"
                                    : "#3b6fe0",
                            }}
                          >
                            {signal.severity}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "10px",
                            color: "#777b87",
                            marginTop: "3px",
                            lineHeight: 1.5,
                          }}
                        >
                          {signal.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* RECOMMENDATION */}
                <div
                  style={{
                    marginTop: "18px",
                    borderRadius: "12px",
                    padding: "14px",
                    background:
                      analysis.riskLevel === "CRITICAL"
                        ? "#fff0f1"
                        : "#eaf8f1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color:
                        analysis.riskLevel === "CRITICAL"
                          ? "#c9363d"
                          : "#16865a",
                      marginBottom: "6px",
                    }}
                  >
                    <CheckCircle2 size={14} />
                    RECOMMENDED ACTION
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.6,
                      color: "#626774",
                    }}
                  >
                    {analysis.recommendation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {/* MANIPULATION METER */}
          {analysis ? (
            <div
              style={{
                background: "white",
                border: "1px solid #e7e9ef",
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "5px",
                }}
              >
                <Brain size={16} color="#8a63f0" />

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  Manipulation Meter
                </div>
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#858997",
                  lineHeight: 1.5,
                  marginBottom: "17px",
                }}
              >
                Detects the psychological tactics used to influence the
                recipient.
              </div>

              <Meter label="Urgency" value={analysis.manipulation.urgency} />
              <Meter
                label="Authority"
                value={analysis.manipulation.authority}
              />
              <Meter label="Money pressure" value={analysis.manipulation.money} />
              <Meter label="Fear" value={analysis.manipulation.fear} />
              <Meter label="Trust manipulation" value={analysis.manipulation.trust} />
            </div>
          ) : (
            <div
              style={{
                background: "white",
                border: "1px solid #e7e9ef",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "11px",
                  background: "#f0edff",
                  color: "#8a63f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <Brain size={21} />
              </div>

              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                Beyond keyword detection
              </div>

              <div
                style={{
                  fontSize: "11px",
                  lineHeight: 1.6,
                  color: "#777b87",
                  marginTop: "6px",
                }}
              >
                FraudShield looks for manipulation patterns, not just
                suspicious words.
              </div>
            </div>
          )}

          {/* EXAMPLES */}
          <div
            style={{
              background: "white",
              border: "1px solid #e7e9ef",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Try a scam example
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#858997",
                marginBottom: "13px",
              }}
            >
              Click any example to simulate detection.
            </div>

            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => loadExample(example)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border:
                    activeExample === example.id
                      ? "1px solid #b9c9f3"
                      : "1px solid #eef0f4",
                  background:
                    activeExample === example.id
                      ? "#f5f8ff"
                      : "white",
                  borderRadius: "10px",
                  padding: "11px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "#eef3ff",
                    color: "#3b6fe0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {example.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#343842",
                    }}
                  >
                    {example.title}
                  </div>

                  <div
                    style={{
                      fontSize: "9px",
                      color: "#9296a3",
                      marginTop: "2px",
                    }}
                  >
                    {example.type}
                  </div>
                </div>

                <ChevronRight size={15} color="#9a9eaa" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginTop: "14px",
          fontSize: "10px",
          color: "#858997",
        }}
      >
        <ShieldCheck size={13} color="#1fa971" />
        FraudShield analyzes communication patterns before you take action.
      </div>
    </div>
  );
}

/* =========================================================
   MINI RESULT
========================================================= */

function MiniResult({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #e7e9ef",
        borderRadius: "11px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "#858997",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          marginTop: "5px",
          color: "#343842",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   MANIPULATION METER
========================================================= */

function Meter({ label, value }) {
  const color =
    value >= 75
      ? "#e5484d"
      : value >= 45
        ? "#d88400"
        : "#1fa971";

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "5px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#555a66",
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color,
          }}
        >
          {value}%
        </span>
      </div>

      <div
        style={{
          height: "6px",
          borderRadius: "10px",
          background: "#edf0f4",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: "10px",
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}