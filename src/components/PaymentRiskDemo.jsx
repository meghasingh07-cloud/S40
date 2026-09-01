import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Volume2,
  Mic,
  MicOff,
  AlertOctagon,
  XCircle,
  HelpCircle,
  Activity,
  Layers,
  FileText,
  PhoneCall,
  Scale,
  Gift,
  Gamepad2,
  Users,
  UserCheck,
  Baby,
  ShieldAlert,
  BrainCircuit
} from 'lucide-react';

// Hugging Face semantic scam analysis is routed through the authenticated Node API.
const AI_API = '/api/ai';
function authHeaders(){const token=localStorage.getItem('token')||localStorage.getItem('fraudshield-token')||'';return token?{Authorization:`Bearer ${token}`}:{}}
function combineWithScamModel(ruleScore, model){
  const semantic=Number(model?.risk_score||0);
  let combined=Math.round(ruleScore*0.55+semantic*0.45);
  if(semantic>=85) combined=Math.max(combined,semantic);
  return Math.min(100,combined);
}

export default function PaymentRiskDemo({ onBack }) {
  const [step, setStep] = useState(1);

  // -----------------------------
  // PAYMENT FORM
  // -----------------------------
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi');

  // -----------------------------
  // CHILD PROTECTION
  // -----------------------------
  const [childProtectionEnabled, setChildProtectionEnabled] = useState(true);
  const [guardianApproval, setGuardianApproval] = useState(false);
  const [isGamingPayment, setIsGamingPayment] = useState(false);

  // -----------------------------
  // NLP / RISK STATE
  // -----------------------------
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedVectors, setDetectedVectors] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [initialAnalysis, setInitialAnalysis] = useState(null);
  const [backendAnalysis, setBackendAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [secondThoughtAnswers, setSecondThoughtAnswers] = useState({});
  const [intentCategory, setIntentCategory] =
    useState('Benign / Conversational');

  const [activeScamType, setActiveScamType] = useState(null);

  const recognitionRef = useRef(null);
  const aiRequestIdRef = useRef(0);

  // -----------------------------
  // LIVE AI FUSION
  // -----------------------------
  // The browser speech layer is intentionally immediate for a hackathon demo;
  // the authenticated Node API then fuses it with the dedicated Hugging Face
  // scam/call models and the user's payment history.
  useEffect(() => {
    const trimmed = transcript.trim();
    if (!trimmed) return undefined;
    const requestId = ++aiRequestIdRef.current;
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const response = await fetch(`${AI_API}/payment-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            amount: Number(amount),
            category: note || 'other',
            beneficiary_id: recipient,
            call_transcript: trimmed,
            call_language: /\b(kaise|aapka|aapki|karo|kijiye|bhejo|abhi|warna|mat|nahi|hai|ho|se)\b/i.test(trimmed) ? 'hinglish' : 'en-IN',
            call_active: step === 2,
            external_context: [
              { source: 'payment', event: 'UPI payment initiated', text: `₹${Number(amount || 0).toLocaleString('en-IN')} to ${recipient}` },
              ...(note ? [{ source: 'payment_note', event: 'Payment note', text: note }] : []),
              { source: 'phone_call', event: 'Call transcript', text: trimmed }
            ],
            initial_analysis: initialAnalysis,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || requestId !== aiRequestIdRef.current) return;
        setBackendAnalysis(data);
        setRiskScore(Number(data.risk_score ?? riskScore));
        const backendVectors = (data.signals || []).map((signal) => ({
          type: `backend_${signal.code || 'signal'}`,
          title: signal.title || 'AI risk signal',
          detail: signal.detail || '',
          severity: signal.severity || 'warning',
        }));
        if (backendVectors.length) setDetectedVectors((prev) => {
          const local = prev.filter((v) => !String(v.type).startsWith('backend_'));
          return [...local, ...backendVectors];
        });
      } catch (_) {
        // Local Call Guard remains active if the network/AI layer is temporarily unavailable.
      } finally {
        if (requestId === aiRequestIdRef.current) setIsAnalyzing(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [transcript, step, amount, recipient, note, initialAnalysis]);

  const isFormValid =
    recipient.trim() !== '' &&
    amount.trim() !== '' &&
    Number(amount) > 0;

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');

  // -----------------------------
  // GAMING / CHILD PAYMENT DETECTOR
  // -----------------------------
  const detectGamingPayment = (recipientValue, noteValue) => {
    const combined =
      `${recipientValue} ${noteValue}`.toLowerCase();

    const gamingKeywords =
      /(roblox|free fire|freefire|bgmi|pubg|fortnite|minecraft|steam|playstation|xbox|nintendo|game|gaming|gems|coins|diamonds|skins|battle pass|game pass|in[- ]app purchase|in app purchase|virtual currency)/i;

    const childKeywords =
      /(child|kid|son|daughter|minor|school student|my boy|my girl|my son|my daughter)/i;

    return {
      gaming: gamingKeywords.test(combined),
      child: childKeywords.test(combined)
    };
  };

  // -----------------------------
  // PAYMENT CONTEXT CHECK
  // -----------------------------
  useEffect(() => {
    const result = detectGamingPayment(recipient, note);

    setIsGamingPayment(result.gaming);

    if (
      childProtectionEnabled &&
      result.gaming
    ) {
      setDetectedVectors((prev) => {
        const exists = prev.some(
          (v) => v.type === 'child_payment'
        );

        if (exists) return prev;

        return [
          ...prev,
          {
            type: 'child_payment',
            title: 'Child / Gaming Payment Protection',
            detail:
              'Payment appears related to gaming, virtual currency or an in-app purchase. Guardian verification may be required for protected family accounts.',
            severity: 'warning'
          }
        ];
      });
    }
  }, [
    recipient,
    note,
    childProtectionEnabled
  ]);

  // -----------------------------
  // BEHAVIORAL NLP ENGINE
  // -----------------------------
  const evaluateBehavioralRisk = (text) => {
    if (!text || text.trim() === '') {
      const gamingResult = detectGamingPayment(
        recipient,
        note
      );

      if (
        childProtectionEnabled &&
        gamingResult.gaming
      ) {
        setDetectedVectors([
          {
            type: 'child_payment',
            title: 'Child / Gaming Payment Protection',
            detail:
              'Payment appears related to gaming or virtual currency. Guardian approval is recommended.',
            severity: 'warning'
          }
        ]);

        setRiskScore(35);
        setIntentCategory(
          'Gaming / Child Payment Review'
        );
        setActiveScamType('child_payment');

        return;
      }

      setDetectedVectors([]);
      setRiskScore(8);
      setIntentCategory(
        'Benign / Conversational'
      );
      setActiveScamType(null);
      return;
    }

    const raw = text.toLowerCase();

    const vectors = [];
    let score = 8;
    let primaryIntent =
      'Benign Conversation';

    let identifiedScam = null;

    // -----------------------------
    // SAFE NARRATION
    // -----------------------------
    const isSafeNarration =
      /(did not (share|give|send|show)|checked (myself|my app|statement)|called (the )?official (website|number|customer care)|verified (on|via|from) (the )?app|no problem|happy to wait|give it some time)/i.test(
        raw
      );

    // -----------------------------
    // 1. OTP / PIN / CVV THEFT
    // -----------------------------
    const isDemandingCredentials =
      /(tell me|give me|read out|share( with)? me|send me|what is).*(your )?(otp|upi pin|pin|password|passcode|cvv|secret code|6-digit|4-digit)/i;
    if (
      isDemandingCredentials.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'otp_theft',
        title:
          'Direct Credential Extraction Request',
        detail:
          'Caller explicitly commands you to vocalize confidential authentication codes or PINs.',
        severity: 'critical'
      });

      score += 85;
      identifiedScam = 'otp_theft';
      primaryIntent =
        'Credential Extraction Trap';
    }

    // -----------------------------
    // 1B. BANK/INSTITUTION IMPERSONATION MONEY REQUEST
    // -----------------------------
    const isMoneyDemand =
      /(send me|transfer to me|give me|transfer)\s+(the\s+)?(money|cash|[₹$]?\s?\d[\d,]*)|need\s+(the\s+)?\d.{0,20}from you/i;

    const hasInstitutionPretext =
      /(bank|sbi|hdfc|icici|axis bank|kyc|verif|bank employee|bank official|account (will be|is|has been) (blocked|suspended))/i;

    if (
      isMoneyDemand.test(raw) &&
      hasInstitutionPretext.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'bank_impersonation_payment_request',
        title:
          'Bank/Institution Impersonation Payment Request',
        detail:
          'Caller claims bank/institution authority and demands an outbound payment under a verification pretext.',
        severity: 'critical'
      });

      score += 65;

      if (!identifiedScam) {
        identifiedScam = 'bank_impersonation_payment_request';
      }

      primaryIntent =
        'Bank Impersonation Payment Request';
    }

    // -----------------------------
    // 2. COLLECT REQUEST / APP MANIPULATION
    // -----------------------------
    const isDemandingAppAction =
      /(open your (upi|payment) (app|application) and (approve|accept)|click (on )?(the |this )?(link|apk|button) (to receive|to verify)|accept the (collect|payment) request)/i;

    if (
      isDemandingAppAction.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'collect_request',
        title:
          'Outbound Execution & Collect Request Manipulation',
        detail:
          'Caller is commanding you to approve requests or open external links under the guise of verification.',
        severity: 'critical'
      });

      score += 80;

      if (!identifiedScam) {
        identifiedScam =
          'collect_request';
      }

      primaryIntent =
        'Guided Execution Trap';
    }

    // -----------------------------
    // 3. REFUND / FAKE CREDIT
    // -----------------------------
    const isInboundMoneyClaim =
      /(i have (sent|transferred|credited|refunded) (the |some )?money to (your|you)|congratulations you (have )?won (a )?(lottery|prize|kbc|cashback))/i;

    if (
      isInboundMoneyClaim.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'refund',
        title:
          'Inverted Value Flow Fallacy',
        detail:
          'Caller claims money is being sent to you while supervising an outbound payment.',
        severity: 'critical'
      });

      score += 70;

      if (!identifiedScam) {
        identifiedScam = 'refund';
      }

      primaryIntent =
        'Inbound Credit Deception';
    }

    // -----------------------------
    // 4. AUTHORITY IMPERSONATION
    // -----------------------------
    const isAuthorityThreat =
      /(calling from (the )?(cyber crime|police station|cbi office|customs department|narcotics bureau))|(you are under (digital )?arrest)|(arrest warrant issued against you)/i;

    if (
      isAuthorityThreat.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'authority',
        title:
          'Law Enforcement / Cyber Crime Impersonation',
        detail:
          'Caller is invoking police or investigative agency authority to create fear and urgency.',
        severity: 'critical'
      });

      score += 85;

      if (!identifiedScam) {
        identifiedScam = 'authority';
      }

      primaryIntent =
        'Law Enforcement Coercion';
    }

    // -----------------------------
    // 5. ISOLATION / COERCION
    // -----------------------------
    const isIsolationCoercion =
      /(do not (hang up|disconnect|tell anyone))|(stay on (the )?call while you (pay|transfer))|(keep this strictly confidential)/i;

    if (
      isIsolationCoercion.test(raw) &&
      !isSafeNarration
    ) {
      vectors.push({
        type: 'isolation',
        title:
          'Victim Isolation & Supervised Coercion',
        detail:
          'Caller is preventing you from disconnecting or independently verifying the situation.',
        severity: 'critical'
      });

      score += 45;

      if (!identifiedScam) {
        identifiedScam =
          'subtle_social_engineering';
      }

      if (
        primaryIntent ===
        'Benign Conversation'
      ) {
        primaryIntent =
          'Supervised Isolation';
      }
    }

    // -----------------------------
    // 6. CHILD / GAMING PAYMENT
    // -----------------------------
    const gamingResult =
      detectGamingPayment(
        recipient,
        note
      );

    const childNarrative =
      /(my (son|daughter|child|kid)|child wants|kid wants|for my child|for my son|for my daughter|needs gems|needs coins|wants gems|wants coins|game purchase|buy gems|buy coins|buy diamonds|game recharge)/i.test(
        raw
      );

    const gamingContext =
      gamingResult.gaming ||
      childNarrative;

    if (
      childProtectionEnabled &&
      gamingContext
    ) {
      const numericAmount =
        Number(amount || 0);

      vectors.push({
        type: 'child_payment',
        title:
          'Child / Gaming Payment Protection',
        detail:
          'Payment context indicates a possible gaming or virtual-currency purchase. FraudShield recommends guardian verification before payment.',
        severity:
          numericAmount >= 2000
            ? 'critical'
            : 'warning'
      });

      score +=
        numericAmount >= 2000
          ? 35
          : 25;

      if (!identifiedScam) {
        identifiedScam =
          'child_payment';
      }

      primaryIntent =
        'Gaming / Child Payment Review';
    }

    // -----------------------------
    // 7. HIGH VALUE GAMING PURCHASE
    // -----------------------------
    if (
      childProtectionEnabled &&
      gamingContext &&
      Number(amount || 0) >= 5000
    ) {
      vectors.push({
        type: 'high_value_gaming',
        title:
          'High-Value Gaming Purchase',
        detail:
          `₹${Number(
            amount
          ).toLocaleString(
            'en-IN'
          )} gaming-related payment exceeds the recommended family protection threshold.`,
        severity: 'critical'
      });

      score += 20;

      primaryIntent =
        'High-Value Child Payment Review';
    }

    // -----------------------------
    // SAFE NARRATION RESET
    // -----------------------------
    if (
      isSafeNarration &&
      vectors.filter(
        (v) =>
          v.type !==
          'child_payment'
      ).length === 0
    ) {
      const gamingOnly =
        childProtectionEnabled &&
        gamingContext;

      if (!gamingOnly) {
        score = 8;
        primaryIntent =
          'Benign / Conversational';
        identifiedScam = null;
      }
    }

    setActiveScamType(
      identifiedScam
    );

    setDetectedVectors(vectors);

    setRiskScore(
      Math.min(98, score)
    );

    setIntentCategory(
      vectors.length > 0
        ? primaryIntent
        : 'Benign / Conversational'
    );
  };

  // -----------------------------
  // RISK STATUS
  // -----------------------------
  const getRiskStatus = (score) => {
    if (score >= 70) {
      return {
        level: 'HIGH RISK',
        title:
          `🔴 HIGH RISK THREAT VERDICT — ${score}% RISK`,
        statusLabel:
          `CRITICAL SOCIAL-ENGINEERING PATTERN (${score}%)`,
        theme: '#ef4444',
        themeBg:
          'rgba(239, 68, 68, 0.12)',
        border: '#f87171',
        text: '#fecdd3',
        subtext: '#be123c',
        recommendation:
          '🛑 Freeze transaction immediately. Disconnect the call and verify independently.'
      };
    }

    if (score >= 30) {
      return {
        level: 'SUSPICIOUS',
        title:
          `🟡 SUSPICIOUS ACTIVITY VERDICT — ${score}% RISK`,
        statusLabel:
          `SUSPICIOUS PATTERN DETECTED (${score}%)`,
        theme: '#f59e0b',
        themeBg:
          'rgba(245, 158, 11, 0.14)',
        border: '#fbbf24',
        text: '#fef3c7',
        subtext: '#b45309',
        recommendation:
          '⚠️ Verify the recipient and payment context before approving.'
      };
    }

    return {
      level: 'SAFE',
      title:
        `🟢 SAFE TRANSACTION VERDICT — ${score}% RISK`,
      statusLabel:
        `BENIGN CONVERSATION • NO COERCIVE VECTORS (${score}%)`,
      theme: '#10b981',
      themeBg:
        'rgba(16, 185, 129, 0.12)',
      border: '#34d399',
      text: '#a7f3d0',
      subtext: '#047857',
      recommendation:
        '✅ Safe to proceed with normal PIN entry.'
    };
  };

  const currentStatus =
    getRiskStatus(riskScore);

  const isHighRisk =
    riskScore >= 70;

  const aiStatusLabel = isAnalyzing ? 'AI ANALYSIS IN PROGRESS…' : backendAnalysis ? `AI FUSED SCORE · ${riskScore}/100` : 'LOCAL SAFETY GUARD ACTIVE';

  // -----------------------------
  // SPEECH RECOGNITION
  // -----------------------------
  useEffect(() => {
    if (step === 2) {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition =
          new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () =>
          setIsListening(true);

        recognition.onend = () =>
          setIsListening(false);

        recognition.onresult = (event) => {
          let currentText = '';

          for (
            let i = 0;
            i < event.results.length;
            i++
          ) {
            currentText +=
              event.results[i][0]
                .transcript + ' ';
          }

          setTranscript(
            currentText
          );

          evaluateBehavioralRisk(
            currentText
          );
        };

        recognitionRef.current =
          recognition;

        try {
          recognition.start();
        } catch (err) {
          console.error(
            'Mic error:',
            err
          );
        }
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [step]);

  const toggleMic = () => {
    if (!recognitionRef.current)
      return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(
          'Microphone error:',
          err
        );
      }
    }
  };

  // -----------------------------
  // STYLES
  // -----------------------------
  const styles = {
    container: {
      padding: '24px',
      fontFamily:
        'Inter, system-ui, -apple-system, sans-serif',
      color: '#1e293b',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    },

    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#475569',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '16px',
      padding: '6px 0'
    },

    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow:
        '0 1px 3px rgba(0, 0, 0, 0.04)',
      boxSizing: 'border-box'
    },

    input: {
      width: '100%',
      backgroundColor: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      color: '#0f172a',
      outline: 'none',
      boxSizing: 'border-box'
    }
  };

  return (
    <div style={styles.container}>

      {/* BACK */}
      <button
        type="button"
        onClick={() => {
          if (step > 1) {
            setStep(step - 1);
          } else if (onBack) {
            onBack();
          }
        }}
        style={styles.backButton}
      >
        <ArrowLeft size={16} />

        {step > 1
          ? 'Back to Previous Step'
          : 'Back to Dashboard'}
      </button>

      {/* PROGRESS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {[
          {
            num: 1,
            label: '1. Payment Details'
          },
          {
            num: 2,
            label:
              '2. Multi-Vector Call NLP'
          },
          {
            num: 3,
            label:
              '3. Behavioral Risk Verdict'
          }
        ].map((item) => (
          <div
            key={item.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor:
                  step >= item.num
                    ? currentStatus.theme
                    : '#e2e8f0',
                color:
                  step >= item.num
                    ? '#ffffff'
                    : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '12px'
              }}
            >
              {item.num}
            </div>

            <span
              style={{
                fontSize: '13px',
                fontWeight:
                  step === item.num
                    ? '700'
                    : '500',
                color:
                  step === item.num
                    ? '#0f172a'
                    : '#64748b'
              }}
            >
              {item.label}
            </span>

            {item.num !== 3 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor:
                    step > item.num
                      ? currentStatus.theme
                      : '#e2e8f0',
                  margin: '0 8px'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* =====================================================
          STEP 1
      ===================================================== */}

      {step === 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr 1fr',
            gap: '24px',
            alignItems: 'start'
          }}
        >

          <div style={{ marginBottom: '14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: isAnalyzing ? '#b45309' : '#047857' }}>{aiStatusLabel}</div>

      {/* PAYMENT CARD */}
          <div style={styles.card}>

            <div
              style={{
                borderBottom:
                  '1px solid #f1f5f9',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700'
                }}
              >
                Initiate Secure Transfer
              </h2>

              <p
                style={{
                  margin:
                    '4px 0 0',
                  fontSize: '12px',
                  color: '#64748b'
                }}
              >
                Beneficiary, device,
                call stream and family
                context will be verified
                before authorization.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!isFormValid) return;
                setIsAnalyzing(true);
                try {
                  const response = await fetch(`${AI_API}/payment-initial`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({
                      amount: Number(amount),
                      category: note || 'other',
                      beneficiary_id: recipient,
                      channel: paymentMode === 'upi' ? 'UPI' : paymentMode,
                      external_context: [{ source: 'payment', event: 'Payment initiated', text: `₹${Number(amount).toLocaleString('en-IN')} to ${recipient}` }],
                    }),
                  });
                  const data = await response.json().catch(() => null);
                  if (response.ok && data) {
                    setInitialAnalysis(data);
                    setBackendAnalysis(data);
                    setRiskScore(Number(data.risk_score ?? 8));
                  } else {
                    evaluateBehavioralRisk(transcript);
                  }
                } catch (_) {
                  evaluateBehavioralRisk(transcript);
                } finally {
                  setIsAnalyzing(false);
                  setStep(2);
                }
              }}
            >

              {/* RECIPIENT */}
              <div
                style={{
                  marginBottom: '16px'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform:
                      'uppercase',
                    color: '#475569',
                    marginBottom: '8px'
                  }}
                >
                  Recipient UPI ID /
                  Account
                </label>

                <input
                  type="text"
                  value={recipient}
                  onChange={(e) =>
                    setRecipient(
                      e.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="e.g. college_admin@oksbi, game-store@upi"
                />
              </div>

              {/* AMOUNT */}
              <div
                style={{
                  marginBottom: '16px'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform:
                      'uppercase',
                    color: '#475569',
                    marginBottom: '8px'
                  }}
                >
                  Amount (INR)
                </label>

                <div
                  style={{
                    position:
                      'relative',
                    display: 'flex',
                    alignItems:
                      'center'
                  }}
                >
                  <span
                    style={{
                      position:
                        'absolute',
                      left: '16px',
                      color: '#94a3b8',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    ₹
                  </span>

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    style={{
                      ...styles.input,
                      paddingLeft:
                        '34px',
                      fontWeight: '600'
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* NOTE */}
              <div
                style={{
                  marginBottom: '16px'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform:
                      'uppercase',
                    color: '#475569',
                    marginBottom: '8px'
                  }}
                >
                  Note / Reference
                </label>

                <input
                  type="text"
                  value={note}
                  onChange={(e) =>
                    setNote(
                      e.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="e.g. Buy game gems for my child"
                />
              </div>

              {/* =================================================
                  CHILD PROTECTION
              ================================================= */}

              <div
                style={{
                  background:
                    'linear-gradient(135deg, #faf5ff, #f5f3ff)',
                  border:
                    '1px solid #ddd6fe',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'flex-start',
                    gap: '12px'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius:
                          '10px',
                        background:
                          '#ede9fe',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        flexShrink: 0
                      }}
                    >
                      <Baby
                        size={20}
                        color="#7c3aed"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color:
                            '#4c1d95'
                        }}
                      >
                        Child Payment
                        Protection
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color:
                            '#6d28d9',
                          marginTop:
                            '3px',
                          lineHeight:
                            '1.4'
                        }}
                      >
                        Protect children
                        from accidental
                        gaming and
                        in-app purchases.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setChildProtectionEnabled(
                        !childProtectionEnabled
                      )
                    }
                    style={{
                      border: 'none',
                      background:
                        childProtectionEnabled
                          ? '#7c3aed'
                          : '#cbd5e1',
                      width: '42px',
                      height: '24px',
                      borderRadius:
                        '999px',
                      cursor:
                        'pointer',
                      position:
                        'relative',
                      flexShrink: 0
                    }}
                  >
                    <span
                      style={{
                        position:
                          'absolute',
                        top: '3px',
                        left:
                          childProtectionEnabled
                            ? '21px'
                            : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius:
                          '50%',
                        background:
                          '#ffffff',
                        transition:
                          'left 0.2s'
                      }}
                    />
                  </button>

                </div>

                {childProtectionEnabled && (
                  <div
                    style={{
                      marginTop:
                        '14px',
                      background:
                        '#ffffff',
                      border:
                        '1px solid #ede9fe',
                      borderRadius:
                        '10px',
                      padding:
                        '10px 12px',
                      display:
                        'flex',
                      gap: '8px',
                      alignItems:
                        'flex-start'
                    }}
                  >
                    <ShieldCheck
                      size={15}
                      color="#7c3aed"
                      style={{
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    />

                    <span
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#5b21b6',
                        lineHeight:
                          '1.5'
                      }}
                    >
                      FraudShield will
                      automatically detect
                      gaming purchases,
                      virtual currency,
                      unusual child spending
                      and high-value in-app
                      payments.
                    </span>
                  </div>
                )}

              </div>

              {/* PAYMENT BUTTON */}
              <button
                type="submit"
                disabled={!isFormValid}
                style={{
                  width: '100%',
                  backgroundColor:
                    isFormValid
                      ? '#10b981'
                      : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor:
                    isFormValid
                      ? 'pointer'
                      : 'not-allowed',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap: '8px'
                }}
              >
                <Lock size={16} />

                Pay{' '}
                {amount
                  ? `₹${formattedAmount}`
                  : 'Now'}

                <ArrowRight
                  size={16}
                />
              </button>

            </form>
          </div>

          {/* RIGHT INFORMATION */}
          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '16px'
            }}
          >

            <div style={styles.card}>

              <h3
                style={{
                  margin:
                    '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '8px'
                }}
              >
                <BrainCircuit
                  size={18}
                  color="#10b981"
                />

                Intent-Driven
                Protection
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  margin: 0
                }}
              >
                FraudShield understands
                the context of a payment
                instead of relying only on
                keywords.
              </p>

            </div>

            {/* CHILD PROTECTION PREVIEW */}
            <div
              style={{
                background:
                  '#ffffff',
                border:
                  '1px solid #ddd6fe',
                borderRadius:
                  '16px',
                padding: '20px',
                boxShadow:
                  '0 1px 3px rgba(0,0,0,.04)'
              }}
            >

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '8px',
                  marginBottom:
                    '12px'
                }}
              >
                <Gamepad2
                  size={18}
                  color="#7c3aed"
                />

                <span
                  style={{
                    fontSize:
                      '14px',
                    fontWeight:
                      '700',
                    color:
                      '#4c1d95'
                  }}
                >
                  Gaming Payment
                  Protection
                </span>
              </div>

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '9px'
                }}
              >

                {[
                  'Game gems & virtual currency',
                  'In-app purchases',
                  'Unusual child spending',
                  'High-value gaming transactions'
                ].map(
                  (text, index) => (
                    <div
                      key={index}
                      style={{
                        display:
                          'flex',
                        gap: '8px',
                        alignItems:
                          'center',
                        fontSize:
                          '11px',
                        color:
                          '#64748b'
                      }}
                    >
                      <CheckCircle2
                        size={14}
                        color="#8b5cf6"
                      />

                      {text}
                    </div>
                  )
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          STEP 2
      ===================================================== */}

      {step === 2 && (
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            flexDirection:
              'column',
            gap: '20px'
          }}
        >

          <div
            style={{
              backgroundColor:
                '#0f172a',
              color: '#ffffff',
              borderRadius: '24px',
              padding:
                '30px 24px',
              boxShadow:
                '0 10px 25px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
          >

            {/* STATUS */}
            <div
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: '8px',
                backgroundColor:
                  currentStatus.themeBg,
                color:
                  currentStatus.border,
                padding:
                  '6px 16px',
                borderRadius:
                  '9999px',
                fontSize: '11px',
                fontWeight: '700',
                marginBottom:
                  '16px'
              }}
            >

              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius:
                    '50%',
                  backgroundColor:
                    currentStatus.theme,
                  boxShadow:
                    `0 0 8px ${currentStatus.theme}`
                }}
              />

              {currentStatus.statusLabel}
            </div>

            {/* CALL ICON */}
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius:
                  '50%',
                backgroundColor:
                  '#1e293b',
                margin:
                  '0 auto 12px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                border:
                  `2px solid ${currentStatus.theme}`
              }}
            >
              <Volume2
                size={28}
                color={
                  currentStatus.theme
                }
              />
            </div>

            <h3
              style={{
                margin:
                  '0 0 4px 0',
                fontSize:
                  '18px',
                fontWeight:
                  '700'
              }}
            >
              Incoming Call:
              +91 98210-XXXXX
            </h3>

            <p
              style={{
                margin:
                  '0 0 16px 0',
                fontSize:
                  '12px',
                color:
                  '#94a3b8'
              }}
            >
              Target:{' '}
              <code>
                {recipient}
              </code>{' '}
              • Amount:{' '}
              <strong>
                ₹{formattedAmount}
              </strong>
            </p>

            {/* CHILD PAYMENT NOTICE */}
            {isGamingPayment &&
              childProtectionEnabled && (
                <div
                  style={{
                    background:
                      'rgba(124,58,237,.15)',
                    border:
                      '1px solid #8b5cf6',
                    borderRadius:
                      '12px',
                    padding:
                      '12px',
                    marginBottom:
                      '16px',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                    textAlign:
                      'left'
                  }}
                >
                  <Gamepad2
                    size={20}
                    color="#a78bfa"
                  />

                  <div>
                    <div
                      style={{
                        fontSize:
                          '12px',
                        fontWeight:
                          '700',
                        color:
                          '#c4b5fd'
                      }}
                    >
                      Gaming Payment
                      Detected
                    </div>

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#a5b4fc',
                        marginTop:
                          '2px'
                      }}
                    >
                      Family Protection
                      is monitoring this
                      transaction.
                    </div>
                  </div>
                </div>
              )}

            {/* NLP */}
            <div
              style={{
                backgroundColor:
                  '#1e293b',
                borderRadius:
                  '16px',
                padding:
                  '16px',
                textAlign:
                  'left',
                marginBottom:
                  '20px',
                border:
                  `1px solid ${currentStatus.theme}`
              }}
            >

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    '10px'
                }}
              >

                <span
                  style={{
                    fontSize:
                      '11px',
                    color:
                      '#94a3b8',
                    textTransform:
                      'uppercase',
                    fontWeight:
                      '700',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '6px'
                  }}
                >
                  <Activity
                    size={14}
                    color={
                      currentStatus.theme
                    }
                  />

                  Speech Intent
                  Frame Classifier
                </span>

                <button
                  type="button"
                  onClick={
                    toggleMic
                  }
                  style={{
                    backgroundColor:
                      isListening
                        ? currentStatus.theme
                        : '#475569',
                    color:
                      '#fff',
                    border:
                      'none',
                    borderRadius:
                      '6px',
                    padding:
                      '4px 10px',
                    fontSize:
                      '11px',
                    fontWeight:
                      '600',
                    cursor:
                      'pointer',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap:
                      '4px'
                  }}
                >
                  {isListening ? (
                    <Mic size={12} />
                  ) : (
                    <MicOff
                      size={12}
                    />
                  )}

                  {isListening
                    ? 'Mic Active'
                    : 'Enable Mic'}
                </button>

              </div>

              <textarea
                value={
                  transcript
                }
                onChange={(e) => {
                  setTranscript(
                    e.target.value
                  );

                  evaluateBehavioralRisk(
                    e.target.value
                  );
                }}
                placeholder="Speak into microphone or type here..."
                rows={3}
                style={{
                  width:
                    '100%',
                  backgroundColor:
                    currentStatus.themeBg,
                  border:
                    `1px solid ${currentStatus.border}`,
                  borderRadius:
                    '10px',
                  color:
                    currentStatus.text,
                  padding:
                    '12px',
                  fontSize:
                    '13px',
                  lineHeight:
                    '1.4',
                  boxSizing:
                    'border-box',
                  outline:
                    'none',
                  resize:
                    'none'
                }}
              />

              {/* VECTORS */}
              <div
                style={{
                  marginTop:
                    '12px',
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '6px'
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    fontSize:
                      '11px'
                  }}
                >
                  <span
                    style={{
                      color:
                        '#94a3b8'
                    }}
                  >
                    Classified Intent:{' '}
                    <strong
                      style={{
                        color:
                          currentStatus.border
                      }}
                    >
                      {intentCategory}
                    </strong>
                  </span>

                  <span
                    style={{
                      color:
                        '#94a3b8'
                    }}
                  >
                    Active Vectors:{' '}
                    <strong
                      style={{
                        color:
                          currentStatus.border
                      }}
                    >
                      {
                        detectedVectors.length
                      }
                    </strong>
                  </span>
                </div>

                {detectedVectors.map(
                  (v, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize:
                          '11px',
                        color:
                          v.type ===
                          'child_payment'
                            ? '#ddd6fe'
                            : '#fecdd3',
                        backgroundColor:
                          v.type ===
                          'child_payment'
                            ? 'rgba(124,58,237,.12)'
                            : 'rgba(239,68,68,.1)',
                        padding:
                          '8px 10px',
                        borderRadius:
                          '6px',
                        borderLeft:
                          `3px solid ${
                            v.type ===
                            'child_payment'
                              ? '#8b5cf6'
                              : currentStatus.theme
                          }`
                      }}
                    >
                      <strong>
                        {v.title}
                      </strong>
                      : {v.detail}
                    </div>
                  )
                )}

              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setStep(3)
              }
              style={{
                width:
                  '100%',
                backgroundColor:
                  currentStatus.theme,
                color:
                  '#ffffff',
                border:
                  'none',
                borderRadius:
                  '12px',
                padding:
                  '14px',
                fontWeight:
                  '700',
                fontSize:
                  '14px',
                cursor:
                  'pointer',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                gap: '8px'
              }}
            >
              {isHighRisk
                ? 'Proceed to Risk Interception'
                : riskScore >= 30
                  ? 'Proceed to Risk Review'
                  : 'Proceed to Security Evaluation'}

              <ArrowRight
                size={16}
              />
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          STEP 3
      ===================================================== */}

      {step === 3 && (
        <div
          style={{
            maxWidth:
              '840px',
            margin:
              '0 auto',
            display:
              'flex',
            flexDirection:
              'column',
            gap: '20px'
          }}
        >

          {/* MAIN VERDICT */}
          <div
            style={{
              backgroundColor:
                currentStatus.themeBg,
              border:
                `1.5px solid ${currentStatus.border}`,
              borderRadius:
                '20px',
              padding:
                '24px'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '12px',
                marginBottom:
                  '16px'
              }}
            >

              {isHighRisk ? (
                <AlertOctagon
                  size={34}
                  color="#ef4444"
                />
              ) : riskScore >= 30 ? (
                <AlertTriangle
                  size={34}
                  color="#f59e0b"
                />
              ) : (
                <ShieldCheck
                  size={34}
                  color="#10b981"
                />
              )}

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      '21px',
                    fontWeight:
                      '800',
                    color:
                      currentStatus.theme
                  }}
                >
                  {currentStatus.title}
                </h2>

                <span
                  style={{
                    fontSize:
                      '12px',
                    color:
                      currentStatus.subtext,
                    fontWeight:
                      '600'
                  }}
                >
                  Intent Profile:{' '}
                  <strong>
                    {intentCategory}
                  </strong>
                </span>
              </div>
            </div>

            {/* VECTOR BREAKDOWN */}
            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '8px'
              }}
            >

              {detectedVectors.length >
              0 ? (
                detectedVectors.map(
                  (v, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor:
                          '#ffffff',
                        border:
                          `1px solid ${
                            v.type ===
                            'child_payment'
                              ? '#c4b5fd'
                              : currentStatus.border
                          }`,
                        padding:
                          '12px 14px',
                        borderRadius:
                          '10px',
                        color:
                          v.type ===
                          'child_payment'
                            ? '#6d28d9'
                            : currentStatus.theme
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            '13px',
                          fontWeight:
                            '700',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '6px'
                        }}
                      >

                        {v.type ===
                        'child_payment' ? (
                          <Gamepad2
                            size={16}
                            color="#7c3aed"
                          />
                        ) : (
                          <AlertTriangle
                            size={15}
                            color={
                              currentStatus.theme
                            }
                          />
                        )}

                        {v.title}
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#64748b',
                          marginTop:
                            '3px'
                        }}
                      >
                        {v.detail}
                      </div>

                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    backgroundColor:
                      '#ffffff',
                    border:
                      '1px solid #a7f3d0',
                    padding:
                      '14px',
                    borderRadius:
                      '10px',
                    fontSize:
                      '13px',
                    fontWeight:
                      '600',
                    color:
                      '#065f46',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap:
                      '8px'
                  }}
                >
                  <CheckCircle2
                    size={18}
                    color="#10b981"
                  />

                  No psychological
                  coercion or guided
                  manipulation detected.
                </div>
              )}

            </div>
          </div>

          {/* =================================================
              CHILD PROTECTION CARD
          ================================================= */}

          {childProtectionEnabled &&
            (
              activeScamType ===
                'child_payment' ||
              isGamingPayment ||
              detectedVectors.some(
                (v) =>
                  v.type ===
                  'child_payment'
              )
            ) && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg,#faf5ff,#f5f3ff)',
                  border:
                    '1.5px solid #c4b5fd',
                  borderRadius:
                    '18px',
                  padding:
                    '22px'
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                    marginBottom:
                      '14px'
                  }}
                >

                  <div
                    style={{
                      width:
                        '42px',
                      height:
                        '42px',
                      borderRadius:
                        '12px',
                      background:
                        '#ede9fe',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center'
                    }}
                  >
                    <Gamepad2
                      size={22}
                      color="#7c3aed"
                    />
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          '16px',
                        fontWeight:
                          '800',
                        color:
                          '#4c1d95'
                      }}
                    >
                      Child Payment
                      Protection
                    </h3>

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#7c3aed',
                        marginTop:
                          '3px'
                      }}
                    >
                      Gaming / virtual
                      currency purchase
                      detected
                    </div>
                  </div>

                </div>

                <div
                  style={{
                    background:
                      '#ffffff',
                    border:
                      '1px solid #ddd6fe',
                    borderRadius:
                      '12px',
                    padding:
                      '14px',
                    marginBottom:
                      '14px'
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      gap: '9px',
                      alignItems:
                        'flex-start'
                    }}
                  >
                    <ShieldAlert
                      size={18}
                      color="#7c3aed"
                    />

                    <div>
                      <div
                        style={{
                          fontSize:
                            '13px',
                          fontWeight:
                            '700',
                          color:
                            '#4c1d95'
                        }}
                      >
                        Guardian verification
                        recommended
                      </div>

                      <p
                        style={{
                          margin:
                            '5px 0 0',
                          fontSize:
                            '12px',
                          color:
                            '#64748b',
                          lineHeight:
                            '1.5'
                        }}
                      >
                        This payment appears
                        related to gaming,
                        virtual currency or
                        an in-app purchase.
                        FraudShield can pause
                        the payment until a
                        parent or guardian
                        confirms it.
                      </p>
                    </div>
                  </div>

                </div>

                {/* GUARDIAN APPROVAL */}
                <label
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                    cursor:
                      'pointer',
                    background:
                      guardianApproval
                        ? '#f0fdf4'
                        : '#ffffff',
                    border:
                      guardianApproval
                        ? '1px solid #86efac'
                        : '1px solid #ddd6fe',
                    padding:
                      '12px',
                    borderRadius:
                      '10px'
                  }}
                >

                  <input
                    type="checkbox"
                    checked={
                      guardianApproval
                    }
                    onChange={(e) =>
                      setGuardianApproval(
                        e.target.checked
                      )
                    }
                    style={{
                      width:
                        '17px',
                      height:
                        '17px',
                      accentColor:
                        '#7c3aed'
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontSize:
                          '12px',
                        fontWeight:
                          '700',
                        color:
                          guardianApproval
                            ? '#166534'
                            : '#4c1d95'
                      }}
                    >
                      <UserCheck
                        size={14}
                        style={{
                          verticalAlign:
                            'middle',
                          marginRight:
                            '5px'
                        }}
                      />

                      Guardian approval
                      confirmed
                    </div>

                    <div
                      style={{
                        fontSize:
                          '10px',
                        color:
                          '#64748b',
                        marginTop:
                          '2px'
                      }}
                    >
                      Simulated family
                      protection approval
                    </div>
                  </div>

                </label>

              </div>
            )}

          {/* AUTHORITY PROTOCOL */}
          {isHighRisk &&
            activeScamType ===
              'authority' && (
              <>
                <div
                  style={{
                    backgroundColor:
                      '#ffffff',
                    border:
                      '1.5px solid #fed7aa',
                    borderRadius:
                      '16px',
                    padding:
                      '20px'
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                      color:
                        '#9a3412',
                      fontWeight:
                        '700',
                      fontSize:
                        '14px',
                      marginBottom:
                        '8px'
                    }}
                  >
                    <Scale
                      size={18}
                      color="#ea580c"
                    />

                    Law Enforcement
                    Impersonation
                  </div>

                  <p
                    style={{
                      fontSize:
                        '13px',
                      color:
                        '#431407',
                      lineHeight:
                        '1.5',
                      margin: 0
                    }}
                  >
                    Genuine authorities
                    do not demand UPI
                    transfers, "safe
                    account" payments or
                    money over a phone
                    call.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor:
                      '#f8fafc',
                    border:
                      '1px solid #cbd5e1',
                    borderRadius:
                      '16px',
                    padding:
                      '20px'
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '8px',
                      color:
                        '#1e293b',
                      fontWeight:
                        '700',
                      fontSize:
                        '14px',
                      marginBottom:
                        '12px'
                    }}
                  >
                    <FileText
                      size={18}
                      color="#0284c7"
                    />

                    Independent
                    Verification
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#334155',
                      lineHeight:
                        '1.5'
                    }}
                  >
                    Disconnect and
                    independently verify
                    the caller using an
                    official source.
                  </div>
                </div>
              </>
            )}

          {/* =================================================
              ROOT CAUSE
          ================================================= */}

          <div style={styles.card}>

            <h3
              style={{
                margin:
                  '0 0 8px 0',
                fontSize:
                  '16px',
                fontWeight:
                  '700',
                color:
                  '#0f172a',
                display:
                  'flex',
                alignItems:
                  'center',
                gap:
                  '8px'
              }}
            >
              <Layers
                size={18}
                color="#3b82f6"
              />

              Explainable Root-Cause
              Analysis
            </h3>

            <p
              style={{
                fontSize:
                  '13px',
                color:
                  '#475569',
                lineHeight:
                  '1.6',
                margin:
                  '0 0 16px 0'
              }}
            >

              {detectedVectors.some(
                (v) =>
                  v.type ===
                  'child_payment'
              ) ? (
                <>
                  FraudShield detected
                  a possible gaming or
                  child-related payment
                  of{' '}
                  <strong>
                    ₹{formattedAmount}
                  </strong>{' '}
                  to{' '}
                  <strong>
                    {recipient}
                  </strong>
                  . Family Protection
                  recommends guardian
                  verification before
                  payment.
                </>
              ) : isHighRisk ? (
                <>
                  FraudShield intercepted
                  payment of{' '}
                  <strong>
                    ₹{formattedAmount}
                  </strong>{' '}
                  to{' '}
                  <strong>
                    {recipient}
                  </strong>{' '}
                  because active
                  social-engineering
                  vectors were detected.
                </>
              ) : riskScore >= 30 ? (
                <>
                  Caution advised for
                  payment of{' '}
                  <strong>
                    ₹{formattedAmount}
                  </strong>{' '}
                  to{' '}
                  <strong>
                    {recipient}
                  </strong>
                  . Moderate risk
                  signals were detected.
                </>
              ) : (
                <>
                  The conversational
                  stream associated with
                  this payment exhibits
                  natural, unpressured
                  dialogue with no
                  significant manipulation
                  detected.
                </>
              )}

            </p>

            {/* RECOMMENDATION */}
            <div
              style={{
                backgroundColor:
                  currentStatus.themeBg,
                borderLeft:
                  `4px solid ${currentStatus.theme}`,
                padding:
                  '12px 16px',
                borderRadius:
                  '4px 8px 8px 4px',
                marginBottom:
                  '24px'
              }}
            >

              <div
                style={{
                  fontWeight:
                    '700',
                  fontSize:
                    '13px',
                  color:
                    currentStatus.theme,
                  marginBottom:
                    '2px'
                }}
              >
                Recommended Action:
              </div>

              <div
                style={{
                  fontSize:
                    '13px',
                  color:
                    currentStatus.subtext
                }}
              >
                {detectedVectors.some(
                  (v) =>
                    v.type ===
                    'child_payment'
                )
                  ? guardianApproval
                    ? 'Guardian approval recorded. Continue only after verifying the purchase and recipient.'
                    : 'Pause payment and obtain guardian approval before completing the gaming purchase.'
                  : currentStatus.recommendation}
              </div>

            </div>

            {backendAnalysis?.second_thought?.show && (
              <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '14px', border: '1px solid #fbbf24', background: '#fffbeb' }}>
                <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '6px' }}>
                  🛡️ Before you continue, verify this request.
                </div>
                <div style={{ fontSize: '12px', color: '#78350f', marginBottom: '10px' }}>
                  A high-confidence risk signal was detected. Take a second thought before authorizing the payment.
                </div>
                {(backendAnalysis.second_thought.questions || []).map((q, i) => (
                  <label key={q} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px', fontSize: '12px', color: '#451a03' }}>
                    <input type="checkbox" checked={Boolean(secondThoughtAnswers[i])} onChange={(e) => setSecondThoughtAnswers((prev) => ({ ...prev, [i]: e.target.checked }))} />
                    <span>{q}</span>
                  </label>
                ))}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div
              style={{
                display:
                  'flex',
                gap: '12px',
                flexWrap:
                  'wrap'
              }}
            >

              {/* HIGH RISK */}
              {isHighRisk ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        'Payment cancelled. Transaction and risk signals logged to FraudShield.'
                      );

                      if (onBack)
                        onBack();
                    }}
                    style={{
                      flex:
                        1.5,
                      backgroundColor:
                        '#ef4444',
                      color:
                        '#ffffff',
                      border:
                        'none',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '700',
                      fontSize:
                        '13px',
                      cursor:
                        'pointer',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap:
                        '8px'
                    }}
                  >
                    <XCircle
                      size={16}
                    />

                    Cancel Payment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        detectedVectors
                          .map(
                            (v) =>
                              `• ${v.title}`
                          )
                          .join('\n')
                      )
                    }
                    style={{
                      flex: 1,
                      backgroundColor:
                        '#f1f5f9',
                      color:
                        '#334155',
                      border:
                        '1px solid #cbd5e1',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '600',
                      fontSize:
                        '13px',
                      cursor:
                        'pointer',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap:
                        '6px'
                    }}
                  >
                    <HelpCircle
                      size={16}
                    />

                    Review Factors
                  </button>
                </>
              ) : detectedVectors.some(
                  (v) =>
                    v.type ===
                    'child_payment'
                ) ? (
                <>
                  {/* CHILD PAYMENT */}
                  <button
                    type="button"
                    disabled={
                      !guardianApproval
                    }
                    onClick={() => {
                      alert(
                        `Guardian approval verified. Proceeding with gaming payment of ₹${formattedAmount}.`
                      );
                    }}
                    style={{
                      flex:
                        1.5,
                      backgroundColor:
                        guardianApproval
                          ? '#7c3aed'
                          : '#cbd5e1',
                      color:
                        '#ffffff',
                      border:
                        'none',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '700',
                      fontSize:
                        '13px',
                      cursor:
                        guardianApproval
                          ? 'pointer'
                          : 'not-allowed',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap:
                        '8px'
                    }}
                  >
                    <UserCheck
                      size={16}
                    />

                    {guardianApproval
                      ? 'Guardian Approved — Proceed'
                      : 'Guardian Approval Required'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        'Gaming payment cancelled. Family Protection remains enabled.'
                      );

                      if (onBack)
                        onBack();
                    }}
                    style={{
                      backgroundColor:
                        '#f1f5f9',
                      color:
                        '#64748b',
                      border:
                        '1px solid #e2e8f0',
                      padding:
                        '14px 20px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '600',
                      fontSize:
                        '13px',
                      cursor:
                        'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {/* NORMAL SAFE PAYMENT */}
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        `Proceeding to secure UPI PIN entry for ₹${formattedAmount}.`
                      )
                    }
                    style={{
                      flex:
                        1.5,
                      backgroundColor:
                        '#10b981',
                      color:
                        '#ffffff',
                      border:
                        'none',
                      padding:
                        '14px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '700',
                      fontSize:
                        '13px',
                      cursor:
                        'pointer',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap:
                        '8px'
                    }}
                  >
                    <Lock
                      size={16}
                    />

                    Proceed to Pay
                    <ArrowRight
                      size={16}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onBack)
                        onBack();
                    }}
                    style={{
                      backgroundColor:
                        '#f1f5f9',
                      color:
                        '#64748b',
                      border:
                        '1px solid #e2e8f0',
                      padding:
                        '14px 20px',
                      borderRadius:
                        '12px',
                      fontWeight:
                        '600',
                      fontSize:
                        '13px',
                      cursor:
                        'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}