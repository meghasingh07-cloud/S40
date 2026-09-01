import { useRef, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Link as LinkIcon,
  LockKeyhole,
  Smartphone,
  MessageSquareWarning,
  RefreshCw,
} from "lucide-react";
import "./ScamAwareness.css";

export default function ScamAwareness({ onBack }) {
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedImage(null);
    setPreview("");
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeImage = () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setResult(null);

    /*
      DEMO ANALYSIS

      This is currently a frontend demonstration.
      Later, this function can be connected to Gemini Vision
      or another AI backend to actually read and analyze
      the uploaded screenshot.
    */

    setTimeout(() => {
      setAnalyzing(false);

      setResult({
        level: "HIGH RISK",
        title: "Potential Scam Detected",
        description:
          "This screenshot contains patterns commonly associated with online scams. Verify the sender before taking any financial action.",
        reasons: [
          "Urgent or threatening language may be used to pressure the user.",
          "The message may be requesting sensitive financial information.",
          "Suspicious payment instructions or links may be present.",
          "The sender's identity should be independently verified.",
        ],
        actions: [
          "Do not make the requested payment.",
          "Never share your UPI PIN or OTP.",
          "Do not click suspicious links.",
          "Verify the message using the bank or service's official contact.",
        ],
      });
    }, 1800);
  };

  const resetAnalysis = () => {
    removeImage();
  };

  return (
    <div className="scam-awareness-page">

      {/* HEADER */}
      <div className="scam-header">

        <button className="scam-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="scam-title-section">
          <div className="scam-title-icon">
            <ShieldCheck size={30} />
          </div>

          <div>
            <h1>Scam Awareness</h1>
            <p>
              Check suspicious messages, payment requests and screenshots
              before taking action.
            </p>
          </div>
        </div>

        <div className="awareness-status">
          <span></span>
          Protection Guide
        </div>

      </div>

      {/* INTRO BANNER */}
      <div className="scam-awareness-banner">

        <div className="banner-shield">
          <ShieldCheck size={34} />
        </div>

        <div>
          <span className="banner-label">STAY SAFE WITH FRAUDSHIELD</span>

          <h2>
            Not sure if a message is genuine?
          </h2>

          <p>
            Upload a screenshot and check for common scam warning signs
            before you pay, click or share information.
          </p>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="scam-main-grid">

        {/* SCREENSHOT ANALYZER */}
        <div className="scam-card screenshot-card">

          <div className="card-heading">
            <div className="heading-icon">
              <ImageIcon size={21} />
            </div>

            <div>
              <h3>Check a Suspicious Screenshot</h3>
              <p>
                Upload a screenshot of the suspicious message or payment.
              </p>
            </div>
          </div>

          {!preview ? (

            <div
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <Upload size={30} />
              </div>

              <h3>Upload Screenshot</h3>

              <p>
                Click here to select an image from your device
              </p>

              <span className="upload-supported">
                SMS • WhatsApp • Bank Notice • Payment • QR Code
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
            </div>

          ) : (

            <div className="preview-section">

              <div className="image-preview-wrapper">

                <img
                  src={preview}
                  alt="Uploaded suspicious screenshot"
                  className="uploaded-image"
                />

                <button
                  className="remove-image-btn"
                  onClick={removeImage}
                  aria-label="Remove image"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="selected-file">

                <div className="file-icon">
                  <ImageIcon size={18} />
                </div>

                <div className="file-details">
                  <strong>{selectedImage?.name}</strong>
                  <span>
                    {(selectedImage?.size / 1024).toFixed(1)} KB
                  </span>
                </div>

              </div>

              {!result && (
                <button
                  className="analyze-btn"
                  onClick={analyzeImage}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      Analyzing Screenshot...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Analyze Screenshot
                    </>
                  )}
                </button>
              )}

            </div>
          )}

          {/* ANALYSIS RESULT */}
          {result && (

            <div className="analysis-result">

              <div className="result-header">

                <div className="result-icon danger">
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <span className="result-label">
                    FRAUDSHIELD ANALYSIS
                  </span>

                  <h3>{result.title}</h3>
                </div>

                <div className="risk-badge">
                  {result.level}
                </div>

              </div>

              <p className="result-description">
                {result.description}
              </p>

              {/* WHY */}
              <div className="result-section">

                <h4>
                  <AlertTriangle size={17} />
                  Why this may be a scam
                </h4>

                <div className="reason-list">

                  {result.reasons.map((reason, index) => (
                    <div className="reason-item" key={index}>
                      <span>!</span>
                      <p>{reason}</p>
                    </div>
                  ))}

                </div>

              </div>

              {/* ACTIONS */}
              <div className="result-section safe-actions">

                <h4>
                  <ShieldCheck size={17} />
                  What you should do
                </h4>

                <div className="action-list">

                  {result.actions.map((action, index) => (
                    <div className="action-item" key={index}>
                      <CheckCircle2 size={17} />
                      <p>{action}</p>
                    </div>
                  ))}

                </div>

              </div>

              <button
                className="check-another-btn"
                onClick={resetAnalysis}
              >
                <RefreshCw size={17} />
                Check Another Screenshot
              </button>

            </div>

          )}

        </div>

        {/* QUICK SAFETY TIPS */}
        <div className="scam-card tips-card">

          <div className="card-heading">

            <div className="heading-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3>Common Scam Signs</h3>
              <p>
                Learn what to look for before responding.
              </p>
            </div>

          </div>

          <div className="tip-list">

            <div className="tip-item">
              <div className="tip-icon red">
                <MessageSquareWarning size={19} />
              </div>

              <div>
                <strong>Urgent Messages</strong>
                <span>
                  "Act now", "account blocked" or threats are warning signs.
                </span>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon orange">
                <LinkIcon size={19} />
              </div>

              <div>
                <strong>Suspicious Links</strong>
                <span>
                  Avoid unknown links asking you to log in or make payments.
                </span>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon purple">
                <LockKeyhole size={19} />
              </div>

              <div>
                <strong>OTP / UPI PIN Requests</strong>
                <span>
                  Banks never need your UPI PIN or OTP to receive money.
                </span>
              </div>
            </div>

            <div className="tip-item">
              <div className="tip-icon blue">
                <Smartphone size={19} />
              </div>

              <div>
                <strong>Fake Support Calls</strong>
                <span>
                  Never install remote-access apps when instructed by strangers.
                </span>
              </div>
            </div>

          </div>

          {/* GOLDEN RULE */}
          <div className="golden-rule">

            <div className="golden-icon">
              🛡️
            </div>

            <div>
              <strong>FraudShield Golden Rule</strong>

              <p>
                Stop • Think • Verify
              </p>

              <span>
                Never rush into a payment because someone is pressuring you.
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* AWARENESS CATEGORIES */}
      <div className="scam-card categories-card">

        <div className="categories-heading">
          <div>
            <h3>Know These Common Scams</h3>
            <p>
              Simple awareness can prevent financial loss.
            </p>
          </div>
        </div>

        <div className="category-grid">

          <div className="scam-category">
            <div>🏦</div>
            <strong>Fake KYC</strong>
            <span>
              Messages claiming your bank account will be blocked.
            </span>
          </div>

          <div className="scam-category">
            <div>💰</div>
            <strong>Fake Refund</strong>
            <span>
              Scammers pretending to issue refunds or cashback.
            </span>
          </div>

          <div className="scam-category">
            <div>📱</div>
            <strong>UPI Scam</strong>
            <span>
              Fake collect requests and payment approval tricks.
            </span>
          </div>

          <div className="scam-category">
            <div>🎁</div>
            <strong>Prize Scam</strong>
            <span>
              Fake lottery, rewards or prize messages asking for payment.
            </span>
          </div>

          <div className="scam-category">
            <div>👮</div>
            <strong>Authority Scam</strong>
            <span>
              Fake police, government or legal threats used to scare users.
            </span>
          </div>

          <div className="scam-category">
            <div>🔗</div>
            <strong>Phishing</strong>
            <span>
              Fake websites and links designed to steal information.
            </span>
          </div>

        </div>

      </div>

      {/* FOOTER NOTE */}
      <div className="privacy-note">
        <ShieldCheck size={16} />
        <span>
          Your screenshot is used only for scam checking in this demonstration.
          Never share your OTP, UPI PIN or banking password.
        </span>
      </div>

    </div>
  );
}