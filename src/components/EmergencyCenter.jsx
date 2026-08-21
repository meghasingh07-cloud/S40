import { useState } from "react";
import {
  ShieldAlert,
  Lock,
  Unlock,
  CreditCard,
  Phone,
  Siren,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  FileWarning,
  Clock3,
  UserRound,
  Bell,
  Ban,
  Activity,
  Copy,
  Eye,
  ChevronRight,
} from "lucide-react";
import "./EmergencyCenter.css";

export default function EmergencyCenter({ onBack }) {
  const [isFrozen, setIsFrozen] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [trustedContactNotified, setTrustedContactNotified] = useState(false);

  const [modal, setModal] = useState(null);
  const [incident, setIncident] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [caseId, setCaseId] = useState("");

  const [timeline, setTimeline] = useState([
    {
      time: "10:30 AM",
      title: "FraudShield monitoring active",
      description: "Real-time payment protection is enabled.",
      type: "safe",
    },
  ]);

  const addTimelineEvent = (title, description, type = "danger") => {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setTimeline((prev) => [
      ...prev,
      {
        time,
        title,
        description,
        type,
      },
    ]);
  };

  const freezeAccount = () => {
    setIsFrozen(true);
    setPaymentBlocked(true);

    addTimelineEvent(
      "Account temporarily frozen",
      "Outgoing payment activity has been restricted.",
      "danger"
    );

    addTimelineEvent(
      "New beneficiaries restricted",
      "FraudShield has temporarily restricted payments to new recipients.",
      "warning"
    );

    addTimelineEvent(
      "Enhanced monitoring enabled",
      "Suspicious activity monitoring has been increased.",
      "safe"
    );

    setModal(null);
  };

  const restoreAccount = () => {
    setIsFrozen(false);
    setPaymentBlocked(false);

    addTimelineEvent(
      "Account protection restored",
      "Your simulated account has been returned to normal operation.",
      "safe"
    );

    setModal(null);
  };

  const blockPayment = () => {
    setPaymentBlocked(true);

    addTimelineEvent(
      "UPI and outgoing payments blocked",
      "FraudShield has restricted outgoing payment activity.",
      "danger"
    );

    setModal(null);
  };

  const cancelPendingPayment = () => {
    setPaymentCancelled(true);

    addTimelineEvent(
      "Suspicious payment cancelled",
      "₹20,000 payment to an unknown beneficiary was stopped.",
      "danger"
    );
  };

  const notifyTrustedContact = () => {
    setTrustedContactNotified(true);

    addTimelineEvent(
      "Trusted contact notified",
      "Your emergency contact has been alerted about the incident.",
      "safe"
    );
  };

  const submitReport = () => {
    const generatedCaseId =
      "FS-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(10000 + Math.random() * 90000);

    setCaseId(generatedCaseId);
    setReportSubmitted(true);

    addTimelineEvent(
      "Fraud incident reported",
      `Emergency case ${generatedCaseId} has been created.`,
      "danger"
    );
  };

  return (
    <div className="emergency-page">

      {/* HEADER */}
      <div className="emergency-header">
        <button className="emergency-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="emergency-title-section">
          <div className="emergency-title-icon">
            <ShieldAlert size={28} />
          </div>

          <div>
            <h1>Emergency Center</h1>
            <p>Immediate protection when you suspect fraud</p>
          </div>
        </div>
      </div>

      {/* EMERGENCY BANNER */}
      <div className="emergency-banner">
        <div className="emergency-banner-icon">
          <AlertTriangle size={26} />
        </div>

        <div>
          <h2>Are you experiencing fraud right now?</h2>
          <p>
            Take immediate action to protect your account and stop suspicious
            payment activity.
          </p>
        </div>
      </div>

      {/* EMERGENCY ACTIONS */}
      <section className="emergency-section">
        <div className="section-heading">
          <h2>Emergency Actions</h2>
          <p>Choose an action based on your situation</p>
        </div>

        <div className="emergency-actions-grid">

          {/* FREEZE / RESTORE */}
          <button
            className={`emergency-action-card ${
              isFrozen ? "action-frozen" : ""
            }`}
            onClick={() => {
              if (isFrozen) {
                setModal("restore");
              } else {
                setModal("freeze");
              }
            }}
          >
            <div className="action-icon freeze-icon">
              {isFrozen ? <Unlock size={25} /> : <Lock size={25} />}
            </div>

            <div className="action-content">
              <h3>
                {isFrozen ? "Restore Account" : "Freeze Account"}
              </h3>

              <p>
                {isFrozen
                  ? "Account is protected. Restore normal payment activity."
                  : "Immediately lock payment activity on your account."}
              </p>
            </div>

            <span className="action-arrow">→</span>
          </button>

          {/* BLOCK PAYMENT */}
          <button
            className={`emergency-action-card ${
              paymentBlocked ? "action-frozen" : ""
            }`}
            onClick={() => {
              if (!paymentBlocked) {
                setModal("block");
              }
            }}
          >
            <div className="action-icon payment-icon">
              {paymentBlocked ? <Ban size={25} /> : <CreditCard size={25} />}
            </div>

            <div className="action-content">
              <h3>
                {paymentBlocked
                  ? "Payments Blocked"
                  : "Block Payment / UPI"}
              </h3>

              <p>
                {paymentBlocked
                  ? "Outgoing payment activity is currently restricted."
                  : "Temporarily stop UPI and outgoing payments."}
              </p>
            </div>

            <span className="action-arrow">→</span>
          </button>

          {/* CONTACT BANK */}
          <button
            className="emergency-action-card"
            onClick={() => setModal("bank")}
          >
            <div className="action-icon bank-icon">
              <Phone size={25} />
            </div>

            <div className="action-content">
              <h3>Contact Bank</h3>
              <p>
                Get emergency assistance from your bank immediately.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </button>

          {/* REPORT FRAUD */}
          <button
            className="emergency-action-card"
            onClick={() => setModal("report")}
          >
            <div className="action-icon report-icon">
              <Siren size={25} />
            </div>

            <div className="action-content">
              <h3>Report Fraud</h3>
              <p>
                Report suspicious activity and create an incident case.
              </p>
            </div>

            <span className="action-arrow">→</span>
          </button>
        </div>
      </section>

      {/* LIVE PROTECTION */}
      <section className="protection-card">
        <div className="protection-header">
          <div className="protection-icon">
            <ShieldAlert size={25} />
          </div>

          <div>
            <h2>FraudShield Emergency Protection</h2>

            <div className="protection-status">
              <span className="status-dot"></span>

              {isFrozen
                ? "ENHANCED PROTECTION ACTIVE"
                : "ACTIVE"}
            </div>
          </div>
        </div>

        <div className="protection-divider"></div>

        <div className="protection-items">
          <div className="protection-item">
            <CheckCircle2 size={19} />
            <span>Payment monitoring enabled</span>
          </div>

          <div className="protection-item">
            <CheckCircle2 size={19} />
            <span>Suspicious transactions being monitored</span>
          </div>

          <div className="protection-item">
            <CheckCircle2 size={19} />
            <span>
              {paymentBlocked
                ? "Outgoing payments restricted"
                : "High-risk transactions monitored"}
            </span>
          </div>

          <div className="protection-item">
            <CheckCircle2 size={19} />
            <span>
              {isFrozen
                ? "New beneficiaries restricted"
                : "Beneficiary activity monitored"}
            </span>
          </div>
        </div>
      </section>

      {/* PENDING PAYMENT */}
      {!paymentCancelled && (
        <section className="pending-payment-card">
          <div className="pending-payment-header">
            <div className="pending-icon">
              <CreditCard size={23} />
            </div>

            <div>
              <div className="pending-label">
                PAYMENT REQUIRES ATTENTION
              </div>

              <h2>Suspicious outgoing payment detected</h2>
            </div>

            <span className="high-risk-badge">
              HIGH RISK
            </span>
          </div>

          <div className="payment-details">
            <div>
              <span>Recipient</span>
              <strong>Unknown Beneficiary</strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>₹20,000</strong>
            </div>

            <div>
              <span>Payment method</span>
              <strong>UPI</strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="pending-text">
                Pending
              </strong>
            </div>
          </div>

          <div className="risk-signals">
            <div className="risk-signals-title">
              <AlertTriangle size={17} />
              Why was this flagged?
            </div>

            <div className="signal-list">
              <span>✓ New beneficiary</span>
              <span>✓ Unusual amount</span>
              <span>✓ Suspicious call detected</span>
              <span>✓ Device not previously used</span>
            </div>
          </div>

          <div className="pending-payment-actions">
            <button
              className="cancel-payment-btn"
              onClick={cancelPendingPayment}
            >
              <Ban size={17} />
              Cancel Payment
            </button>

            <button className="trust-payment-btn">
              <CheckCircle2 size={17} />
              I Trust This Payment
            </button>
          </div>
        </section>
      )}

      {/* PAYMENT CANCELLED */}
      {paymentCancelled && (
        <div className="cancelled-payment-card">
          <div className="cancelled-icon">
            <CheckCircle2 size={25} />
          </div>

          <div>
            <h3>Suspicious payment cancelled</h3>
            <p>
              The ₹20,000 payment to the unknown beneficiary was successfully
              stopped by FraudShield.
            </p>
          </div>

          <span className="cancelled-badge">
            PROTECTED
          </span>
        </div>
      )}

      {/* INCIDENT TYPE */}
      <section className="incident-section">
        <div className="section-heading">
          <h2>What happened?</h2>
          <p>
            Select the situation that best describes your concern.
          </p>
        </div>

        <div className="incident-grid">
          {[
            "Unauthorized payment",
            "Suspicious call",
            "UPI / QR scam",
            "Phishing link",
            "Someone has my banking details",
            "Other",
          ].map((item) => (
            <button
              key={item}
              className={`incident-option ${
                incident === item ? "incident-selected" : ""
              }`}
              onClick={() => setIncident(item)}
            >
              <FileWarning size={19} />
              <span>{item}</span>

              {incident === item && (
                <CheckCircle2
                  className="incident-check"
                  size={18}
                />
              )}
            </button>
          ))}
        </div>

        {incident && (
          <div className="incident-selected-message">
            <CheckCircle2 size={18} />

            <span>
              <strong>{incident}</strong> selected.
            </span>
          </div>
        )}
      </section>

      {/* TRUSTED CONTACT */}
      <section className="trusted-contact-card">
        <div className="trusted-contact-header">
          <div className="trusted-contact-icon">
            <UserRound size={24} />
          </div>

          <div>
            <h2>Trusted Contact</h2>
            <p>
              Get someone you trust involved during a suspected fraud.
            </p>
          </div>
        </div>

        <div className="trusted-contact-body">
          <div className="contact-person">
            <div className="contact-avatar">
              M
            </div>

            <div>
              <strong>Emergency Contact</strong>
              <span>Trusted family member</span>
            </div>

            {trustedContactNotified && (
              <span className="notified-badge">
                <CheckCircle2 size={15} />
                Notified
              </span>
            )}
          </div>

          <button
            className="notify-contact-btn"
            onClick={notifyTrustedContact}
            disabled={trustedContactNotified}
          >
            <Bell size={17} />

            {trustedContactNotified
              ? "Contact Notified"
              : "Notify Trusted Contact"}
          </button>
        </div>
      </section>

      {/* EMERGENCY TIMELINE */}
      <section className="timeline-section">
        <div className="section-heading">
          <h2>Emergency Incident Timeline</h2>
          <p>
            See everything FraudShield has done to protect your account.
          </p>
        </div>

        <div className="timeline-card">
          {timeline.map((event, index) => (
            <div className="timeline-item" key={index}>
              <div className="timeline-left">
                <span
                  className={`timeline-dot ${event.type}`}
                ></span>

                {index !== timeline.length - 1 && (
                  <span className="timeline-line"></span>
                )}
              </div>

              <div className="timeline-content">
                <div className="timeline-top">
                  <h3>{event.title}</h3>
                  <span>{event.time}</span>
                </div>

                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVIDENCE RECORD */}
      <section className="evidence-card">
        <div className="evidence-header">
          <div className="evidence-icon">
            <Eye size={23} />
          </div>

          <div>
            <h2>Fraud Evidence Record</h2>
            <p>
              FraudShield automatically records important incident signals.
            </p>
          </div>
        </div>

        <div className="evidence-grid">
          <div className="evidence-item">
            <span>Incident type</span>
            <strong>
              {incident || "Not selected"}
            </strong>
          </div>

          <div className="evidence-item">
            <span>Suspicious amount</span>
            <strong>₹20,000</strong>
          </div>

          <div className="evidence-item">
            <span>Payment method</span>
            <strong>UPI</strong>
          </div>

          <div className="evidence-item">
            <span>Risk level</span>
            <strong className="evidence-high">
              HIGH
            </strong>
          </div>

          <div className="evidence-item">
            <span>Detected signal</span>
            <strong>New beneficiary</strong>
          </div>

          <div className="evidence-item">
            <span>Device status</span>
            <strong>Unrecognized</strong>
          </div>
        </div>

        <div className="evidence-footer">
          <FileWarning size={17} />
          Evidence is stored as part of this simulated fraud incident.
        </div>
      </section>

      {/* CASE INFORMATION */}
      {caseId && (
        <section className="case-card">
          <div className="case-icon">
            <Activity size={23} />
          </div>

          <div className="case-content">
            <span>FRAUDSHIELD CASE ID</span>
            <strong>{caseId}</strong>
            <p>
              Keep this ID for tracking your reported incident.
            </p>
          </div>

          <button
            className="copy-case-btn"
            onClick={() =>
              navigator.clipboard?.writeText(caseId)
            }
          >
            <Copy size={16} />
            Copy
          </button>
        </section>
      )}

      {/* FROZEN ACCOUNT */}
      {isFrozen && (
        <div className="frozen-status-card">
          <div className="frozen-status-icon">
            <Lock size={25} />
          </div>

          <div className="frozen-status-content">
            <h2>ACCOUNT TEMPORARILY FROZEN</h2>

            <p>
              FraudShield has blocked outgoing payment activity to help
              protect your account.
            </p>

            <div className="frozen-checks">
              <span>
                <CheckCircle2 size={17} />
                UPI payments restricted
              </span>

              <span>
                <CheckCircle2 size={17} />
                New beneficiaries restricted
              </span>

              <span>
                <CheckCircle2 size={17} />
                High-risk transactions blocked
              </span>

              <span>
                <CheckCircle2 size={17} />
                Account monitoring increased
              </span>
            </div>

            <button
              className="restore-inline-btn"
              onClick={() => setModal("restore")}
            >
              <Unlock size={17} />
              Restore Account
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div
          className="modal-overlay"
          onClick={() => setModal(null)}
        >
          <div
            className="emergency-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>

            {/* FREEZE */}
            {modal === "freeze" && (
              <>
                <div className="modal-icon danger-modal-icon">
                  <Lock size={28} />
                </div>

                <h2>Freeze your account?</h2>

                <p>
                  This will immediately restrict outgoing payment activity
                  until you choose to restore access.
                </p>

                <div className="modal-warning">
                  <AlertTriangle size={18} />
                  <span>
                    This is a simulated emergency action for the FraudShield
                    demonstration.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    className="modal-danger"
                    onClick={freezeAccount}
                  >
                    <Lock size={17} />
                    Freeze Account
                  </button>
                </div>
              </>
            )}

            {/* RESTORE */}
            {modal === "restore" && (
              <>
                <div className="modal-icon restore-modal-icon">
                  <Unlock size={28} />
                </div>

                <h2>Restore account?</h2>

                <p>
                  This will simulate restoring normal payment activity after
                  the emergency situation has been resolved.
                </p>

                <div className="modal-warning">
                  <AlertTriangle size={18} />
                  <span>
                    In a real system, identity verification would be required
                    before restoring payment access.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    className="modal-primary"
                    onClick={restoreAccount}
                  >
                    <Unlock size={17} />
                    Restore Account
                  </button>
                </div>
              </>
            )}

            {/* BLOCK */}
            {modal === "block" && (
              <>
                <div className="modal-icon payment-modal-icon">
                  <CreditCard size={28} />
                </div>

                <h2>Block Payment / UPI?</h2>

                <p>
                  This will temporarily stop UPI payments and outgoing
                  payment activity.
                </p>

                <div className="modal-warning">
                  <AlertTriangle size={18} />
                  <span>
                    Payment blocking is simulated for this demonstration.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    className="modal-danger"
                    onClick={blockPayment}
                  >
                    <Ban size={17} />
                    Block Payments
                  </button>
                </div>
              </>
            )}

            {/* BANK */}
            {modal === "bank" && (
              <>
                <div className="modal-icon bank-modal-icon">
                  <Phone size={28} />
                </div>

                <h2>Contact your bank</h2>

                <p>
                  For a real fraud incident, contact your bank immediately
                  using an official support channel.
                </p>

                <div className="bank-contact-options">
                  <div className="bank-contact-option">
                    <Phone size={19} />

                    <div>
                      <strong>Emergency Helpline</strong>
                      <span>Available 24 × 7</span>
                    </div>
                  </div>

                  <div className="bank-contact-option">
                    <ShieldAlert size={19} />

                    <div>
                      <strong>Fraud Support</strong>
                      <span>
                        Priority assistance for suspicious activity
                      </span>
                    </div>
                  </div>

                  <div className="bank-contact-option">
                    <FileWarning size={19} />

                    <div>
                      <strong>Fraud Complaint</strong>
                      <span>
                        Keep your transaction details ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-secondary full-width"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {/* REPORT */}
            {modal === "report" && (
              <>
                <div className="modal-icon report-modal-icon">
                  <Siren size={28} />
                </div>

                {!reportSubmitted ? (
                  <>
                    <h2>Report suspicious activity</h2>

                    <p>
                      {incident
                        ? `You selected "${incident}". Submit this incident to create a FraudShield case.`
                        : "Select what happened and submit an incident report."}
                    </p>

                    {!incident && (
                      <div className="report-select-message">
                        <AlertTriangle size={18} />
                        Please select an incident type first.
                      </div>
                    )}

                    <div className="modal-actions">
                      <button
                        className="modal-secondary"
                        onClick={() => setModal(null)}
                      >
                        Cancel
                      </button>

                      <button
                        className="modal-danger"
                        disabled={!incident}
                        onClick={submitReport}
                      >
                        <Siren size={17} />
                        Submit Report
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="success-check">
                      <CheckCircle2 size={34} />
                    </div>

                    <h2>Report submitted</h2>

                    <p>
                      Your simulated fraud report has been successfully
                      recorded by FraudShield.
                    </p>

                    <div className="report-id">
                      Incident ID: <strong>{caseId}</strong>
                    </div>

                    <div className="modal-actions">
                      <button
                        className="modal-primary full-width"
                        onClick={() => {
                          setModal(null);
                          setReportSubmitted(false);
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}