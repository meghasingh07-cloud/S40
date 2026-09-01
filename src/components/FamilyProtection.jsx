import { useState, useRef, useEffect } from "react";
import "./FamilyProtection.css";

export default function FamilyProtection({ onBack }) {
  const [showAlert, setShowAlert] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // 'pending' | 'pin_entry' | 'blocked' | 'approved'
  const [notifications, setNotifications] = useState(true);
  const [approvalLimit, setApprovalLimit] = useState(500);
  const [pin, setPin] = useState(localStorage.getItem("fs_guardian_pin") || "1234");
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [pinSavedMsg, setPinSavedMsg] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first digit when entering PIN view
  useEffect(() => {
    if (paymentStatus === "pin_entry") {
      setPinDigits(["", "", "", ""]);
      setPinError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [paymentStatus]);

  const simulatePayment = () => {
    setPaymentStatus("pending");
    setShowAlert(true);
  };

  const blockPayment = () => {
    setPaymentStatus("blocked");
  };

  const startPinVerification = () => {
    setPaymentStatus("pin_entry");
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1);
    setPinDigits(newDigits);
    setPinError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      const fullPin = newDigits.join("");
      const currentGuardianPin = localStorage.getItem("fs_guardian_pin") || pin;

      if (fullPin === currentGuardianPin) {
        setPaymentStatus("approved");
      } else {
        setPinError(true);
        setPinDigits(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resetPayment = () => {
    setShowAlert(false);
    setPaymentStatus("pending");
    setPinDigits(["", "", "", ""]);
    setPinError(false);
  };

  const handleSetGlobalPin = (newVal) => {
    setPin(newVal);
    localStorage.setItem("fs_guardian_pin", newVal);
    setPinSavedMsg(true);
    setTimeout(() => setPinSavedMsg(false), 2000);
  };

  return (
    <div className="family-page">

      {/* HEADER */}
      <div className="family-header">
        <div>
          <button className="family-back" onClick={onBack}>
            ← Back to Dashboard
          </button>

          <div className="family-title-row">
            <div className="family-title-icon">👪</div>

            <div>
              <h1>Family Protection</h1>
              <p>
                Protect your family from suspicious payments and digital scams.
              </p>
            </div>
          </div>
        </div>

        <div className="family-status">
          <span className="status-dot"></span>
          Protection Active
        </div>
      </div>

      {/* PROTECTION BANNER */}
      <div className="family-banner">
        <div className="banner-icon">🛡️</div>

        <div className="banner-content">
          <div className="banner-eyebrow">
            FRAUDSHIELD FAMILY GUARD
          </div>

          <h2>Your family is protected</h2>

          <p>
            FraudShield monitors unusual payments, new beneficiaries,
            gaming purchases and suspicious activity across protected
            family members.
          </p>
        </div>

        <div className="protected-count">
          <strong>3</strong>
          <span>Members Protected</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="family-grid">

        {/* FAMILY MEMBERS */}
        <div className="family-card members-card">
          <div className="card-header">
            <div>
              <h3>Family Members</h3>
              <p>Protected accounts</p>
            </div>

            <button className="add-member">+ Add Member</button>
          </div>

          {/* MEGHA */}
          <div className="member">
            <div className="member-avatar primary">M</div>
            <div className="member-info">
              <strong>Megha</strong>
              <span>Primary Account Holder</span>
            </div>
            <div className="member-risk low">LOW</div>
            <div className="member-protection">
              <span></span>
              Protected
            </div>
          </div>

          {/* AARAV */}
          <div className="member highlighted">
            <div className="member-avatar child">👦</div>
            <div className="member-info">
              <strong>Aarav</strong>
              <span>Child Account • Age 13</span>
            </div>
            <div className="member-risk medium">MEDIUM</div>
            <div className="member-protection">
              <span></span>
              Protected
            </div>
          </div>

          {/* MOM */}
          <div className="member">
            <div className="member-avatar parent">👩</div>
            <div className="member-info">
              <strong>Mom</strong>
              <span>Family Member</span>
            </div>
            <div className="member-risk low">LOW</div>
            <div className="member-protection">
              <span></span>
              Protected
            </div>
          </div>
        </div>

        {/* CHILD PROTECTION */}
        <div className="family-card child-card">
          <div className="child-card-header">
            <div className="child-icon">🎮</div>
            <div>
              <h3>Child Payment Protection</h3>
              <p>Extra protection for gaming & in-app purchases</p>
            </div>
            <div className="toggle active">
              <div></div>
            </div>
          </div>

          <div className="child-stats">
            <div>
              <span>Protected Child</span>
              <strong>1</strong>
            </div>
            <div>
              <span>Payments Blocked</span>
              <strong>4</strong>
            </div>
            <div>
              <span>Alerts This Month</span>
              <strong>7</strong>
            </div>
          </div>

          <div className="protection-rules">
            <div className="rule">
              <div className="rule-icon">💰</div>
              <div>
                <strong>Large payments</strong>
                <span>Require approval above ₹{approvalLimit}</span>
              </div>
              <span className="check">✓</span>
            </div>

            <div className="rule">
              <div className="rule-icon">🎮</div>
              <div>
                <strong>Gaming purchases</strong>
                <span>Monitor gems, credits & in-app purchases</span>
              </div>
              <span className="check">✓</span>
            </div>

            <div className="rule">
              <div className="rule-icon">🌙</div>
              <div>
                <strong>Late-night payments</strong>
                <span>Extra verification after 10:00 PM</span>
              </div>
              <span className="check">✓</span>
            </div>

            <div className="rule">
              <div className="rule-icon">🆕</div>
              <div>
                <strong>New merchants</strong>
                <span>Monitor first-time payments</span>
              </div>
              <span className="check">✓</span>
            </div>
          </div>

          <button className="simulate-btn" onClick={simulatePayment}>
            🎮 Simulate Child Payment
          </button>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="family-card activity-card">
        <div className="card-header">
          <div>
            <h3>Family Protection Activity</h3>
            <p>Recent security events</p>
          </div>
          <button className="view-all">View All</button>
        </div>

        <div className="activity-list">
          <div className="activity">
            <div className="activity-icon red">🚫</div>
            <div className="activity-info">
              <strong>Gaming payment blocked</strong>
              <span>Aarav • Battle Arena • ₹1,999</span>
            </div>
            <div className="activity-time">2 hours ago</div>
          </div>

          <div className="activity">
            <div className="activity-icon orange">⚠️</div>
            <div className="activity-info">
              <strong>New gaming merchant detected</strong>
              <span>Aarav • Game Store</span>
            </div>
            <div className="activity-time">Yesterday</div>
          </div>

          <div className="activity">
            <div className="activity-icon green">✓</div>
            <div className="activity-info">
              <strong>Payment approved</strong>
              <span>Aarav • ₹299 • Game Credits</span>
            </div>
            <div className="activity-time">2 days ago</div>
          </div>
        </div>
      </div>

      {/* PARENT SETTINGS */}
      <div className="family-grid bottom-grid">
        <div className="family-card settings-card">
          <div className="card-header">
            <div>
              <h3>Parent Controls</h3>
              <p>Manage child payment permissions</p>
            </div>
          </div>

          <div className="setting-row">
            <div>
              <strong>Payment approval limit</strong>
              <span>Require approval for payments above this amount</span>
            </div>

            <select
              value={approvalLimit}
              onChange={(e) => setApprovalLimit(e.target.value)}
            >
              <option value="250">₹250</option>
              <option value="500">₹500</option>
              <option value="1000">₹1,000</option>
              <option value="2000">₹2,000</option>
              <option value="5000">₹5,000</option>
            </select>
          </div>

          {/* GUARDIAN PIN SETTING */}
          <div className="setting-row">
            <div>
              <strong>Guardian Override PIN</strong>
              <span>
                PIN required to authorize child payments {pinSavedMsg && <em style={{ color: "#10b981", fontSize: "11px" }}>• Saved!</em>}
              </span>
            </div>

            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => handleSetGlobalPin(e.target.value)}
              placeholder="1234"
              style={{
                width: "70px",
                padding: "6px 10px",
                textAlign: "center",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontFamily: "monospace",
                fontWeight: "700",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          <div className="setting-row">
            <div>
              <strong>Parent notifications</strong>
              <span>Receive alerts when suspicious child payments occur</span>
            </div>

            <button
              className={`setting-toggle ${notifications ? "on" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              <div></div>
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Gaming purchase protection</strong>
              <span>Monitor gaming and in-app purchases</span>
            </div>
            <div className="setting-toggle on">
              <div></div>
            </div>
          </div>
        </div>

        {/* FAMILY SAFETY SCORE */}
        <div className="family-card safety-score-card">
          <div className="score-heading">
            <div>
              <h3>Family Safety Score</h3>
              <p>Overall protection level</p>
            </div>

            <div className="score-circle">
              <strong>92</strong>
              <span>/100</span>
            </div>
          </div>

          <div className="score-bar">
            <div style={{ width: "92%" }}></div>
          </div>

          <div className="score-status">
            <span>✓</span>
            Excellent protection
          </div>

          <p className="score-description">
            Family Protection is actively monitoring transactions,
            gaming purchases and suspicious activity.
          </p>
        </div>
      </div>

      {/* EMERGENCY ALERT MODAL */}
      {showAlert && (
        <div className="family-modal-overlay">
          <div className="family-modal">

            {/* STATE 1: INITIAL ALERT (Shown in your screenshot) */}
            {paymentStatus === "pending" && (
              <>
                <button className="modal-close" onClick={resetPayment}>×</button>

                <div className="modal-alert-icon">🎮</div>

                <div className="modal-eyebrow">CHILD PAYMENT ALERT</div>

                <h2>Unusual gaming payment detected</h2>

                <p className="modal-description">
                  FraudShield detected a potentially risky payment from a protected child account.
                </p>

                <div className="payment-preview">
                  <div className="payment-user">
                    <div className="payment-avatar">👦</div>
                    <div>
                      <strong>Aarav</strong>
                      <span>Child Account</span>
                    </div>
                  </div>

                  <div className="payment-amount">
                    <span>Amount</span>
                    <strong>₹2,499</strong>
                  </div>
                </div>

                <div className="payment-details">
                  <div>
                    <span>🎮 Merchant</span>
                    <strong>Battle Arena</strong>
                  </div>

                  <div>
                    <span>💎 Purchase</span>
                    <strong>5,000 Game Gems</strong>
                  </div>

                  <div>
                    <span>🕐 Time</span>
                    <strong>11:48 PM</strong>
                  </div>
                </div>

                <div className="risk-warning">
                  <div className="risk-warning-header">
                    <span>🔴</span>
                    <strong>HIGH RISK</strong>
                  </div>

                  <ul>
                    <li>Gaming-related merchant</li>
                    <li>Amount is higher than usual</li>
                    <li>New merchant detected</li>
                    <li>Late-night transaction</li>
                    <li>Child account detected</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button className="block-payment" onClick={blockPayment}>
                    🚫 Block Payment
                  </button>

                  <button className="approve-payment" onClick={startPinVerification}>
                    ✓ Approve with PIN
                  </button>
                </div>

                <button className="review-settings" onClick={resetPayment}>
                  Review Family Protection Settings
                </button>
              </>
            )}

            {/* STATE 2: ENTER GUARDIAN PIN (Appears directly after clicking Approve) */}
            {paymentStatus === "pin_entry" && (
              <div className="result-state" style={{ padding: "10px 0" }}>
                <button className="modal-close" onClick={() => setPaymentStatus("pending")}>×</button>

                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#f5f3ff",
                    border: "1.5px solid #ddd6fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontSize: "24px"
                  }}
                >
                  🔒
                </div>

                <div className="modal-eyebrow" style={{ color: "#7c3aed" }}>
                  GUARDIAN AUTHORIZATION
                </div>

                <h2 style={{ margin: "4px 0 8px" }}>Enter Guardian PIN</h2>

                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 auto 20px", maxWidth: "280px" }}>
                  Enter your 4-digit PIN to approve Aarav's ₹2,499 purchase for Battle Arena.
                </p>

                {/* 4 PIN DIGITS */}
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      style={{
                        width: "48px",
                        height: "56px",
                        borderRadius: "12px",
                        border: `2px solid ${pinError ? "#ef4444" : "#cbd5e1"}`,
                        textAlign: "center",
                        fontSize: "24px",
                        fontWeight: "800",
                        color: pinError ? "#ef4444" : "#1e293b",
                        outline: "none",
                        backgroundColor: "#f8fafc"
                      }}
                    />
                  ))}
                </div>

                {pinError && (
                  <p style={{ color: "#ef4444", fontSize: "12px", fontWeight: "700", margin: "0 0 16px" }}>
                    Incorrect PIN. Try again.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    className="block-payment"
                    style={{ flex: 1 }}
                    onClick={() => setPaymentStatus("pending")}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: PAYMENT BLOCKED */}
            {paymentStatus === "blocked" && (
              <div className="result-state">
                <div className="result-icon blocked">🔒</div>

                <div className="modal-eyebrow">PAYMENT BLOCKED</div>

                <h2>FraudShield stopped the payment</h2>

                <p>
                  The ₹2,499 gaming purchase from Aarav was blocked
                  because it triggered multiple child-protection signals.
                </p>

                <div className="success-list">
                  <div>✓ Payment blocked</div>
                  <div>✓ Parent notification sent</div>
                  <div>✓ Merchant activity recorded</div>
                  <div>✓ Child account remains protected</div>
                </div>

                <button className="done-btn" onClick={resetPayment}>
                  Done
                </button>
              </div>
            )}

            {/* STATE 4: PAYMENT APPROVED WITH PIN */}
            {paymentStatus === "approved" && (
              <div className="result-state">
                <div className="result-icon approved">✓</div>

                <div className="modal-eyebrow">PAYMENT AUTHORIZED</div>

                <h2>Guardian PIN Verified</h2>

                <p>
                  You approved the ₹2,499 gaming purchase for Aarav. The transaction has been authorized to proceed.
                </p>

                <div className="approved-message">
                  🛡️ FraudShield will continue monitoring future activity from this account.
                </div>

                <button className="done-btn" onClick={resetPayment}>
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}