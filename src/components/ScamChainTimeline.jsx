import React, { useState } from "react";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Globe,
  UserPlus,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ExternalLink,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function ScamChainTimeline({ onBack }) {
  const [expanded, setExpanded] = useState(3);

  const events = [
    {
      time: "10:02 AM",
      title: "Suspicious Call Detected",
      description:
        "An unknown caller contacted the user claiming to be a bank representative.",
      type: "CALL",
      icon: <Phone size={19} />,
      color: "#e5484d",
      severity: "HIGH",
      evidence: "Unknown number • First interaction",
    },
    {
      time: "10:05 AM",
      title: "Scam Message Received",
      description:
        "A message was received asking the user to complete an urgent KYC verification.",
      type: "MESSAGE",
      icon: <MessageSquare size={19} />,
      color: "#f5a524",
      severity: "MEDIUM",
      evidence: "Urgent language • KYC-related request",
    },
    {
      time: "10:08 AM",
      title: "Suspicious Link Opened",
      description:
        "The user opened a link associated with the message. The domain does not match the claimed organization.",
      type: "LINK",
      icon: <Globe size={19} />,
      color: "#e5484d",
      severity: "HIGH",
      evidence: "Unknown domain • Recently registered",
    },
    {
      time: "10:11 AM",
      title: "New Beneficiary Added",
      description:
        "A new UPI beneficiary was added shortly after the suspicious interaction.",
      type: "ACCOUNT",
      icon: <UserPlus size={19} />,
      color: "#e5484d",
      severity: "HIGH",
      evidence: "New beneficiary • No previous transaction history",
    },
    {
      time: "10:13 AM",
      title: "High-Value Payment Initiated",
      description:
        "A ₹20,000 payment was initiated to the newly added beneficiary.",
      type: "PAYMENT",
      icon: <CreditCard size={19} />,
      color: "#e5484d",
      severity: "CRITICAL",
      evidence: "₹20,000 • New beneficiary • Unusual sequence",
    },
    {
      time: "10:13 AM",
      title: "FraudShield Intervention",
      description:
        "FraudShield detected the connected sequence and triggered a high-risk payment warning.",
      type: "INTERVENTION",
      icon: <ShieldCheck size={19} />,
      color: "#1fa971",
      severity: "BLOCKED",
      evidence: "Payment warning triggered • User verification required",
    },
  ];

  const chainSteps = [
    {
      label: "Caller",
      icon: <Phone size={17} />,
      color: "#e5484d",
    },
    {
      label: "Message",
      icon: <MessageSquare size={17} />,
      color: "#f5a524",
    },
    {
      label: "Link",
      icon: <Globe size={17} />,
      color: "#e5484d",
    },
    {
      label: "Beneficiary",
      icon: <UserPlus size={17} />,
      color: "#e5484d",
    },
    {
      label: "Payment",
      icon: <CreditCard size={17} />,
      color: "#e5484d",
    },
    {
      label: "Intervention",
      icon: <ShieldCheck size={17} />,
      color: "#1fa971",
    },
  ];

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
          marginBottom: "24px",
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
              fontWeight: 700,
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
              fontWeight: 750,
              letterSpacing: "-0.5px",
            }}
          >
            Scam Chain Timeline
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "13px",
              color: "#7d8291",
            }}
          >
            See how suspicious events connect to form a potential scam.
          </p>
        </div>
      </div>

      {/* ACTIVE CHAIN BANNER */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #fff1f1, #fff8f8)",
          border: "1px solid #f3c5c7",
          borderRadius: "16px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#ffe0e1",
              color: "#e5484d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={23} />
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#e5484d",
                letterSpacing: ".7px",
                marginBottom: "3px",
              }}
            >
              SCAM CHAIN DETECTED
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              A connected sequence of suspicious events was detected.
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#777b87",
                marginTop: "4px",
              }}
            >
              6 events • 11 minutes • Payment intervention triggered
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: "20px",
            background: "#e7f8f0",
            color: "#16865a",
            fontSize: "11px",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          INTERRUPTED
        </div>
      </div>

      {/* ATTACK PATH */}

      <div
        style={{
          background: "white",
          border: "1px solid #e7e9ef",
          borderRadius: "16px",
          padding: "22px",
          marginBottom: "22px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 750,
            marginBottom: "20px",
          }}
        >
          Attack Path
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            minWidth: "720px",
          }}
        >
          {chainSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "92px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: `${step.color}18`,
                    color: step.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${step.color}35`,
                  }}
                >
                  {step.icon}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    marginTop: "8px",
                  }}
                >
                  {step.label}
                </div>
              </div>

              {index < chainSteps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    minWidth: "35px",
                    background:
                      index === chainSteps.length - 2
                        ? "#bce8d5"
                        : "#e7b5b7",
                    position: "relative",
                    top: "-9px",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.5fr) minmax(280px, .8fr)",
          gap: "22px",
          alignItems: "start",
        }}
      >
        {/* TIMELINE */}

        <div
          style={{
            background: "white",
            border: "1px solid #e7e9ef",
            borderRadius: "16px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "22px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 750,
                }}
              >
                Event Timeline
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#858997",
                  marginTop: "3px",
                }}
              >
                Chronological reconstruction of the incident
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                color: "#777b87",
              }}
            >
              <Clock size={14} />
              11 min
            </div>
          </div>

          <div style={{ position: "relative" }}>

            <div
              style={{
                position: "absolute",
                left: "21px",
                top: "22px",
                bottom: "24px",
                width: "2px",
                background: "#e5e7ed",
              }}
            />

            {events.map((event, index) => {
              const isOpen = expanded === index;

              return (
                <div
                  key={`${event.time}-${event.title}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: "16px",
                    marginBottom:
                      index === events.length - 1
                        ? 0
                        : "8px",
                  }}
                >

                  {/* ICON */}

                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: `${event.color}16`,
                      border: `2px solid ${event.color}45`,
                      color: event.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {event.icon}
                  </div>

                  {/* CARD */}

                  <div
                    style={{
                      flex: 1,
                      border: "1px solid #eceef3",
                      borderRadius: "12px",
                      marginBottom: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpanded(
                          isOpen
                            ? null
                            : index
                        )
                      }
                      style={{
                        width: "100%",
                        border: 0,
                        background: "white",
                        padding: "13px 14px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              color:
                                event.color,
                              letterSpacing:
                                ".5px",
                            }}
                          >
                            {event.time}
                          </span>

                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              padding:
                                "3px 6px",
                              borderRadius:
                                "5px",
                              background: `${event.color}12`,
                              color:
                                event.color,
                            }}
                          >
                            {event.type}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            marginTop: "5px",
                          }}
                        >
                          {event.title}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color:
                            event.color,
                          padding:
                            "5px 7px",
                          borderRadius:
                            "6px",
                          background: `${event.color}10`,
                        }}
                      >
                        {event.severity}
                      </div>

                      {isOpen ? (
                        <ChevronUp
                          size={16}
                          color="#858997"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          color="#858997"
                        />
                      )}
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding:
                            "0 14px 14px",
                          borderTop:
                            "1px solid #f0f1f5",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            lineHeight: 1.6,
                            color: "#666b78",
                            margin:
                              "12px 0 9px",
                          }}
                        >
                          {event.description}
                        </p>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "7px",
                            fontSize:
                              "10px",
                            color:
                              "#7b7f8c",
                            background:
                              "#f7f8fa",
                            padding:
                              "8px 9px",
                            borderRadius:
                              "7px",
                          }}
                        >
                          <AlertTriangle
                            size={13}
                          />

                          {event.evidence}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >

          {/* SCAM NARRATIVE */}

          <div
            style={{
              background: "white",
              border: "1px solid #e7e9ef",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  background: "#eef3ff",
                  color: "#3b6fe0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={18} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 750,
                  }}
                >
                  Scam Narrative
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    color: "#858997",
                    marginTop: "2px",
                  }}
                >
                  Connected event interpretation
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#f7f9fd",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "12px",
                lineHeight: 1.7,
                color: "#5f6471",
              }}
            >
              The sequence began with a suspicious phone call,
              followed by an urgent KYC message and a suspicious
              link. Shortly afterward, a new beneficiary was added
              and a ₹20,000 payment was initiated.

              <br />
              <br />

              <strong
                style={{
                  color: "#343842",
                }}
              >
                FraudShield connected these events as one
                potential scam chain rather than treating them
                as isolated incidents.
              </strong>
            </div>
          </div>

          {/* INTERVENTION */}

          <div
            style={{
              background: "#f0faf5",
              border: "1px solid #c9ead9",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <ShieldCheck
                size={20}
                color="#1fa971"
              />

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 750,
                  color: "#147d55",
                }}
              >
                FraudShield Intervention
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.6,
                color: "#527265",
              }}
            >
              The payment was flagged because multiple
              suspicious events occurred within a short period.
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "14px",
                flexWrap: "wrap",
              }}
            >
              {[
                "Payment warning",
                "User verification",
                "Chain detected",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#ffffff",
                    color: "#16865a",
                    border:
                      "1px solid #c9ead9",
                  }}
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          {/* CHAIN EVIDENCE */}

          <div
            style={{
              background: "white",
              border: "1px solid #e7e9ef",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 750,
                marginBottom: "14px",
              }}
            >
              Chain Evidence
            </div>

            <Evidence
              icon={<Phone size={15} />}
              title="Unknown Caller"
              value="+91 ••••• 4821"
            />

            <Evidence
              icon={<Globe size={15} />}
              title="Suspicious Domain"
              value="kyc-verification•••.com"
            />

            <Evidence
              icon={<Smartphone size={15} />}
              title="Device"
              value="Android • Current Device"
            />

            <Evidence
              icon={<CreditCard size={15} />}
              title="Payment Attempt"
              value="₹20,000"
              last
            />
          </div>

        </div>
      </div>
    </div>
  );
}

function Evidence({
  icon,
  title,
  value,
  last,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 0",
        borderBottom: last
          ? "none"
          : "1px solid #f0f1f4",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "8px",
          background: "#f5f6f9",
          color: "#656a77",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "#858997",
            marginBottom: "2px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#343842",
          }}
        >
          {value}
        </div>
      </div>

      <ExternalLink
        size={13}
        color="#9a9eaa"
      />
    </div>
  );
}