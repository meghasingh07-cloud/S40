import { useState, useEffect } from "react";

import ScamChainTimeline from "./components/ScamChainTimeline";
import PaymentRiskDemo from "./components/PaymentRiskDemo";
import FamilyProtection from "./components/FamilyProtection";
import EmergencyCenter from "./components/EmergencyCenter";
import Settings from "./components/Settings";
import Transactions from "./components/Transactions";
import ScamDetection from "./components/ScamDetection";
import FraudIntelligence from "./components/FraudIntelligence";
import ScamAwareness from "./components/ScamAwareness";

import translations from "./translations";
import "./Dashboard.css";

export default function Dashboard({ onNavigate }) {

  // =====================================================
  // PAGE STATES
  // =====================================================

  const [showPaymentDemo, setShowPaymentDemo] = useState(false);
  const [showFamilyProtection, setShowFamilyProtection] = useState(false);
  const [showEmergencyCenter, setShowEmergencyCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScamChainTimeline, setShowScamChainTimeline] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showScamDetection, setShowScamDetection] = useState(false);
  const [showFraudIntelligence, setShowFraudIntelligence] = useState(false);
  const [showScamAwareness, setShowScamAwareness] = useState(false);


  // =====================================================
  // LANGUAGE
  // =====================================================

  const [language, setLanguage] = useState(
    localStorage.getItem("fraudshield-language") || "en"
  );

  useEffect(() => {
    localStorage.setItem("fraudshield-language", language);
  }, [language]);

  const t = translations[language];


  // =====================================================
  // OPEN FRAUD INTELLIGENCE
  // =====================================================

  const openFraudIntelligence = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowScamAwareness(false);

    setShowFraudIntelligence(true);
  };


  // =====================================================
  // OPEN SCAM DETECTION
  // =====================================================

  const openScamDetection = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowScamDetection(true);
  };


  // =====================================================
  // OPEN SCAM AWARENESS
  // =====================================================

  const openScamAwareness = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);

    setShowScamAwareness(true);
  };


  // =====================================================
  // OPEN SCAM CHAIN TIMELINE
  // =====================================================

  const openScamChainTimeline = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowScamChainTimeline(true);
  };


  // =====================================================
  // OPEN TRANSACTIONS
  // =====================================================

  const openTransactions = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowTransactions(true);
  };


  // =====================================================
  // OPEN RISK ANALYSIS
  // =====================================================

  const goToRiskAnalysis = () => {
    onNavigate("risk-analysis");
  };


  // =====================================================
  // OPEN EMERGENCY CENTER
  // =====================================================

  const openEmergencyCenter = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowEmergencyCenter(true);
  };


  // =====================================================
  // OPEN FAMILY PROTECTION
  // =====================================================

  const openFamilyProtection = () => {

    setShowPaymentDemo(false);
    setShowEmergencyCenter(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowFamilyProtection(true);
  };


  // =====================================================
  // OPEN SETTINGS
  // =====================================================

  const openSettings = () => {

    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowEmergencyCenter(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowSettings(true);
  };


  // =====================================================
  // OPEN PAYMENT DEMO
  // =====================================================

  const openPaymentDemo = () => {

    setShowEmergencyCenter(false);
    setShowFamilyProtection(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);

    setShowPaymentDemo(true);
  };


  // =====================================================
  // BACK TO DASHBOARD
  // =====================================================

  const backToDashboard = () => {

    setShowEmergencyCenter(false);
    setShowPaymentDemo(false);
    setShowFamilyProtection(false);
    setShowSettings(false);
    setShowScamChainTimeline(false);
    setShowTransactions(false);
    setShowScamDetection(false);
    setShowFraudIntelligence(false);
    setShowScamAwareness(false);
  };


  return (
    <div className="fs-app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="logo">

          <div className="logo-icon">
            🛡️
          </div>

          <div className="logo-text">

            <div className="top">
              Fraud<span>Shield</span>
            </div>

            <div className="sub">
              {t.paymentSafety}
            </div>

          </div>

        </div>


        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <ul className="nav">

          {/* DASHBOARD */}

          <li>

            <a
              href="#dashboard"

              className={
                !showPaymentDemo &&
                !showEmergencyCenter &&
                !showFamilyProtection &&
                !showSettings &&
                !showScamChainTimeline &&
                !showTransactions &&
                !showScamDetection &&
                !showFraudIntelligence &&
                !showScamAwareness
                  ? "active"
                  : ""
              }

              onClick={(e) => {

                e.preventDefault();

                backToDashboard();

              }}
            >

              <span className="ic">
                🏠
              </span>

              {t.dashboard}

            </a>

          </li>


          {/* =================================================
              TRANSACTIONS
          ================================================= */}

          <li>

            <a
              href="#transactions"

              className={showTransactions ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openTransactions();

              }}
            >

              <span className="ic">
                💳
              </span>

              {t.transactions}

            </a>

          </li>


          {/* =================================================
              MAKE A PAYMENT
          ================================================= */}

          <li>

            <a
              href="#payment"

              className={showPaymentDemo ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openPaymentDemo();

              }}
            >

              <span className="ic">
                💸
              </span>

              {t.makePayment}

            </a>

          </li>


          {/* =================================================
              RISK ANALYSIS
          ================================================= */}

          <li>

            <a
              href="/risk-analysis"

              onClick={(e) => {

                e.preventDefault();

                goToRiskAnalysis();

              }}
            >

              <span className="ic">
                📈
              </span>

              {t.riskAnalysis}

            </a>

          </li>


          {/* =================================================
              SCAM DETECTION
          ================================================= */}

          <li>

            <a
              href="#scam-detection"

              className={showScamDetection ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openScamDetection();

              }}
            >

              <span className="ic">
                🔍
              </span>

              {t.scamDetection}

            </a>

          </li>


          {/* =================================================
              SCAM AWARENESS
          ================================================= */}

          <li>

            <a
              href="#scam-awareness"

              className={showScamAwareness ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openScamAwareness();

              }}
            >

              <span className="ic">
                🛡️
              </span>

              Scam Awareness

            </a>

          </li>


          {/* =================================================
              SCAM CHAIN TIMELINE
          ================================================= */}

          <li>

            <a
              href="#scam-chain"

              className={showScamChainTimeline ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openScamChainTimeline();

              }}
            >

              <span className="ic">
                ⏱️
              </span>

              {t.scamChainTimeline}

            </a>

          </li>


          {/* =================================================
              FAMILY PROTECTION
          ================================================= */}

          <li>

            <a
              href="#family-protection"

              className={showFamilyProtection ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openFamilyProtection();

              }}
            >

              <span className="ic">
                👪
              </span>

              {t.familyProtection}

            </a>

          </li>


          {/* =================================================
              FRAUD INTELLIGENCE
          ================================================= */}

          <li>

            <a
              href="#fraud-intelligence"

              className={showFraudIntelligence ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openFraudIntelligence();

              }}
            >

              <span className="ic">
                🌐
              </span>

              {t.fraudIntelligence}

            </a>

          </li>


          {/* =================================================
              EMERGENCY CENTER
          ================================================= */}

          <li>

            <a
              href="#emergency"

              className={showEmergencyCenter ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openEmergencyCenter();

              }}
            >

              <span className="ic">
                🚨
              </span>

              {t.emergencyCenter}

            </a>

          </li>


          {/* =================================================
              SETTINGS
          ================================================= */}

          <li>

            <a
              href="#settings"

              className={showSettings ? "active" : ""}

              onClick={(e) => {

                e.preventDefault();

                openSettings();

              }}
            >

              <span className="ic">
                ⚙️
              </span>

              {t.settings}

            </a>

          </li>

        </ul>


        {/* =====================================================
            PROTECTION BOX
        ===================================================== */}

        <div className="protect-box">

          <div className="badge">
            ✓
          </div>

          <div className="title">
            {t.youAreProtected}
          </div>

          <div className="desc">
            {t.monitoringAccount}
          </div>

        </div>


        {/* =====================================================
            USER BOX
        ===================================================== */}

        <div className="user-box">

          <div className="avatar">
            M
          </div>

          <div>

            <div className="name">
              Megha
            </div>

            <div className="role">
              {t.protectedAccount}
            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="main">


        {/* =====================================================
            TOPBAR
        ===================================================== */}

        <div className="topbar">

          <div className="search">

            🔍 {t.searchAnything}

            <kbd>
              Ctrl + K
            </kbd>

          </div>


          <div className="topbar-right">


            {/* NOTIFICATION */}

            <div className="icon-btn">

              🔔

              <span className="dot"></span>

            </div>


            {/* LANGUAGE */}

            <div
              className="lang"

              onClick={() =>
                setLanguage(language === "en" ? "hi" : "en")
              }

              style={{
                cursor: "pointer",
              }}

              title={
                language === "en"
                  ? "Switch to Hindi"
                  : "Switch to English"
              }
            >

              🌐{" "}

              {language === "en"
                ? t.english
                : t.hindi}{" "}

              ▾

            </div>


            {/* THEME */}

            <div className="icon-btn">
              🌙
            </div>

          </div>

        </div>


        {/* =====================================================
            PAGE CONTENT SWITCHER
        ===================================================== */}

        {showScamAwareness ? (

          <ScamAwareness
            onBack={backToDashboard}
          />

        ) : showFraudIntelligence ? (

          <FraudIntelligence
            onBack={backToDashboard}
          />

        ) : showScamDetection ? (

          <ScamDetection
            onBack={backToDashboard}
          />

        ) : showTransactions ? (

          <Transactions
            onBack={backToDashboard}
          />

        ) : showScamChainTimeline ? (

          <ScamChainTimeline
            onBack={backToDashboard}
          />

        ) : showEmergencyCenter ? (

          <EmergencyCenter
            onBack={backToDashboard}
          />

        ) : showFamilyProtection ? (

          <FamilyProtection
            onBack={backToDashboard}
          />

        ) : showPaymentDemo ? (

          <PaymentRiskDemo
            onBack={() => {
              setShowPaymentDemo(false);
            }}
          />

        ) : showSettings ? (

          <Settings

            onBack={backToDashboard}

            onOpenFamilyProtection={() => {

              setShowSettings(false);

              setShowFamilyProtection(true);

            }}

            language={language}

            setLanguage={setLanguage}

          />

        ) : (

          /* ===================================================
             NORMAL DASHBOARD
          =================================================== */

          <div className="content">

            {/* =================================================
                STATUS BANNER
            ================================================= */}

            <div className="status-banner">

              <div className="status-left">

                <div className="shield">
                  ✓
                </div>

                <div>

                  <div className="status-eyebrow">
                    {t.paymentSafetyStatus}
                  </div>

                  <div className="status-title">
                    {t.accountProtected}
                  </div>

                  <div className="status-desc">
                    {t.monitoringTransactions}
                  </div>

                </div>

              </div>


              <div className="score-badge">

                <div className="label">
                  ⬡ {t.good}
                </div>

                <div className="value">
                  94%
                </div>

                <div className="label">
                  {t.safetyScore}
                </div>

              </div>

            </div>


            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="stats-row">

              <div className="stat-card">

                <div className="stat-top">

                  <div
                    className="stat-icon"
                    style={{
                      background: "var(--blue-light)",
                      color: "var(--blue)",
                    }}
                  >
                    💳
                  </div>

                </div>

                <div className="stat-label">
                  {t.totalTransactions}
                </div>

                <div className="stat-value">
                  128
                </div>

                <div
                  className="stat-sub"
                  style={{
                    color: "var(--green)",
                  }}
                >
                  ↑ +12% {t.thisMonth}
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-top">

                  <div
                    className="stat-icon"
                    style={{
                      background: "var(--green-light)",
                      color: "var(--green)",
                    }}
                  >
                    🛡️
                  </div>

                </div>

                <div className="stat-label">
                  {t.safeTransactions}
                </div>

                <div className="stat-value">
                  121
                </div>

                <div
                  className="stat-sub"
                  style={{
                    color: "var(--text-light)",
                  }}
                >
                  94.5% {t.ofTotal}
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-top">

                  <div
                    className="stat-icon"
                    style={{
                      background: "var(--orange-light)",
                      color: "var(--orange)",
                    }}
                  >
                    ⚠️
                  </div>

                </div>

                <div className="stat-label">
                  {t.riskAlerts}
                </div>

                <div className="stat-value">
                  5
                </div>

                <div
                  className="stat-sub"
                  style={{
                    color: "var(--red)",
                  }}
                >
                  {t.requiresAttention}
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-top">

                  <div
                    className="stat-icon"
                    style={{
                      background: "var(--purple-light)",
                      color: "var(--purple)",
                    }}
                  >
                    👪
                  </div>

                </div>

                <div className="stat-label">
                  {t.protectedFamily}
                </div>

                <div className="stat-value">
                  3
                </div>

                <div
                  className="stat-sub"
                  style={{
                    color: "var(--purple)",
                  }}
                >
                  {t.protectionEnabled}
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-top">

                  <div
                    className="stat-icon"
                    style={{
                      background: "var(--blue-light)",
                      color: "var(--blue)",
                    }}
                  >
                    🌐
                  </div>

                </div>

                <div className="stat-label">
                  {t.scamReports}
                </div>

                <div className="stat-value">
                  27
                </div>

                <div
                  className="stat-sub"
                  style={{
                    color: "var(--blue)",
                  }}
                >
                  +8 {t.thisWeek}
                </div>

              </div>

            </div>


            {/* =================================================
                MIDDLE GRID
            ================================================= */}

            <div className="grid-3">


              {/* =================================================
                  RECENT TRANSACTIONS
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>
                    {t.recentTransactions}
                  </h3>

                  <a
                    href="#transactions"

                    onClick={(e) => {

                      e.preventDefault();

                      openTransactions();

                    }}
                  >
                    {t.viewAll}
                  </a>

                </div>


                <div className="tx">

                  <div
                    className="tx-icon"
                    style={{
                      background: "#1c1c1c",
                    }}
                  >
                    a
                  </div>

                  <div className="tx-info">

                    <div className="tx-name">
                      Amazon Shopping
                    </div>

                    <div className="tx-meta">
                      {t.shopping}
                    </div>

                  </div>

                  <div>

                    <div className="tx-amt">
                      - ₹2,499
                    </div>

                    <div
                      className="tx-meta"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Today, 10:30 AM
                    </div>

                    <span className="tx-tag safe">
                      {t.safe}
                    </span>

                  </div>

                </div>


                <div className="tx">

                  <div
                    className="tx-icon"
                    style={{
                      background: "var(--green)",
                    }}
                  >
                    ↓
                  </div>

                  <div className="tx-info">

                    <div className="tx-name">
                      Rahul Kumar
                    </div>

                    <div className="tx-meta">
                      {t.received}
                    </div>

                  </div>

                  <div>

                    <div
                      className="tx-amt"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      + ₹5,000
                    </div>

                    <div
                      className="tx-meta"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Today, 09:15 AM
                    </div>

                    <span className="tx-tag safe">
                      {t.safe}
                    </span>

                  </div>

                </div>


                <div className="tx">

                  <div
                    className="tx-icon"
                    style={{
                      background: "var(--red)",
                    }}
                  >
                    !
                  </div>

                  <div className="tx-info">

                    <div className="tx-name">
                      New UPI Beneficiary
                    </div>

                    <div className="tx-meta">
                      {t.unusualTransaction}
                    </div>

                  </div>

                  <div>

                    <div
                      className="tx-amt"
                      style={{
                        color: "var(--red)",
                      }}
                    >
                      - ₹25,000
                    </div>

                    <div
                      className="tx-meta"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Yesterday, 03:45 PM
                    </div>

                    <span className="tx-tag highrisk">
                      {t.highRisk}
                    </span>

                  </div>

                </div>


                <div className="tx">

                  <div
                    className="tx-icon"
                    style={{
                      background: "#e50914",
                    }}
                  >
                    N
                  </div>

                  <div className="tx-info">

                    <div className="tx-name">
                      Netflix Subscription
                    </div>

                    <div className="tx-meta">
                      {t.entertainment}
                    </div>

                  </div>

                  <div>

                    <div className="tx-amt">
                      - ₹649
                    </div>

                    <div
                      className="tx-meta"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Yesterday, 07:20 PM
                    </div>

                    <span className="tx-tag safe">
                      {t.safe}
                    </span>

                  </div>

                </div>


                <div className="tx">

                  <div
                    className="tx-icon"
                    style={{
                      background: "var(--green)",
                    }}
                  >
                    ↑
                  </div>

                  <div className="tx-info">

                    <div className="tx-name">
                      {t.salaryCredit}
                    </div>

                    <div className="tx-meta">
                      {t.received}
                    </div>

                  </div>

                  <div>

                    <div
                      className="tx-amt"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      + ₹45,000
                    </div>

                    <div
                      className="tx-meta"
                      style={{
                        textAlign: "right",
                      }}
                    >
                      15 May, 09:00 AM
                    </div>

                    <span className="tx-tag safe">
                      {t.safe}
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  RISK OVERVIEW
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>
                    {t.riskOverview}
                  </h3>

                  <a
                    href="/risk-analysis"

                    onClick={(e) => {

                      e.preventDefault();

                      goToRiskAnalysis();

                    }}
                  >
                    {t.viewDetails}
                  </a>

                </div>


                <div className="risk-row">

                  <div className="risk-top">

                    <span className="name">
                      📉 {t.transactionRisk}
                    </span>

                    <span
                      className="val"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      {t.low}
                    </span>

                  </div>

                  <div className="bar-bg">

                    <div
                      className="bar-fill"
                      style={{
                        width: "25%",
                        background: "var(--green)",
                      }}
                    />

                  </div>

                </div>


                <div className="risk-row">

                  <div className="risk-top">

                    <span className="name">
                      👤 {t.beneficiaryRisk}
                    </span>

                    <span
                      className="val"
                      style={{
                        color: "var(--orange)",
                      }}
                    >
                      {t.medium}
                    </span>

                  </div>

                  <div className="bar-bg">

                    <div
                      className="bar-fill"
                      style={{
                        width: "55%",
                        background: "var(--orange)",
                      }}
                    />

                  </div>

                </div>


                <div className="risk-row">

                  <div className="risk-top">

                    <span className="name">
                      🎭 {t.scamActivity}
                    </span>

                    <span
                      className="val"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      {t.low}
                    </span>

                  </div>

                  <div className="bar-bg">

                    <div
                      className="bar-fill"
                      style={{
                        width: "30%",
                        background: "var(--green)",
                      }}
                    />

                  </div>

                </div>


                <div className="risk-row">

                  <div className="risk-top">

                    <span className="name">
                      💻 {t.deviceRisk}
                    </span>

                    <span
                      className="val"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      {t.low}
                    </span>

                  </div>

                  <div className="bar-bg">

                    <div
                      className="bar-fill"
                      style={{
                        width: "15%",
                        background: "var(--green)",
                      }}
                    />

                  </div>

                </div>


                <button
                  className="run-btn"
                  onClick={goToRiskAnalysis}
                >
                  📊 {t.runFullRiskAnalysis}
                </button>

              </div>


              {/* =================================================
                  QUICK ACTIONS
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>
                    {t.quickActions}
                  </h3>

                </div>


                <div className="qa-grid">


                  {/* MAKE PAYMENT */}

                  <div
                    className="qa-item"

                    onClick={openPaymentDemo}

                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className="ic"
                      style={{
                        background: "var(--blue-light)",
                        color: "var(--blue)",
                      }}
                    >
                      💸
                    </div>

                    <div className="lbl">
                      {t.makePayment}
                    </div>

                  </div>


                  {/* ANALYZE SCAM */}

                  <div
                    className="qa-item"

                    onClick={openScamDetection}

                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className="ic"
                      style={{
                        background: "var(--green-light)",
                        color: "var(--green)",
                      }}
                    >
                      🔎
                    </div>

                    <div className="lbl">
                      {t.analyzeScam}
                    </div>

                  </div>


                  {/* FAMILY PROTECTION */}

                  <div
                    className="qa-item"

                    onClick={openFamilyProtection}

                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className="ic"
                      style={{
                        background: "var(--purple-light)",
                        color: "var(--purple)",
                      }}
                    >
                      👪
                    </div>

                    <div className="lbl">
                      {t.familyProtection}
                    </div>

                  </div>


                  {/* EMERGENCY CENTER */}

                  <div
                    className="qa-item"

                    onClick={openEmergencyCenter}

                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <div
                      className="ic"
                      style={{
                        background: "var(--red-light)",
                        color: "var(--red)",
                      }}
                    >
                      🆘
                    </div>

                    <div className="lbl">
                      {t.emergencyCenter}
                    </div>

                  </div>


                  {/* SCAN QR */}

                  <div
                    className="qa-item"

                    style={{
                      gridColumn: "1 / -1",
                    }}
                  >

                    <div
                      className="ic"
                      style={{
                        background: "var(--orange-light)",
                        color: "var(--orange)",
                      }}
                    >
                      📷
                    </div>

                    <div className="lbl">
                      {t.scanQRCode}
                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                BOTTOM GRID
            ================================================= */}

            <div className="grid-bottom">


              {/* =================================================
                  TOP SCAM TYPES
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>

                    {t.topScamTypes}{" "}

                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--text-light)",
                        fontSize: "11px",
                      }}
                    >
                      ({t.thisMonth})
                    </span>

                  </h3>

                </div>


                <div className="donut-wrap">

                  <div className="donut">

                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 36 36"
                    >

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#eef0f6"
                        strokeWidth="4"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#3b6fe0"
                        strokeWidth="4"
                        strokeDasharray="42 58"
                        strokeDashoffset="25"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#f5a524"
                        strokeWidth="4"
                        strokeDasharray="28 72"
                        strokeDashoffset="-17"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#8a63f0"
                        strokeWidth="4"
                        strokeDasharray="18 82"
                        strokeDashoffset="-45"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#e5484d"
                        strokeWidth="4"
                        strokeDasharray="8 92"
                        strokeDashoffset="-63"
                      />

                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#9fa3b8"
                        strokeWidth="4"
                        strokeDasharray="4 96"
                        strokeDashoffset="-71"
                      />

                    </svg>


                    <div className="center">

                      <div className="num">
                        145
                      </div>

                      <div className="lbl">
                        {t.total}
                      </div>

                    </div>

                  </div>


                  <div className="legend">


                    <div className="legend-item">

                      <span
                        className="legend-dot"
                        style={{
                          background: "#3b6fe0",
                        }}
                      />

                      {t.kycScam}

                      <b>
                        42%
                      </b>

                    </div>


                    <div className="legend-item">

                      <span
                        className="legend-dot"
                        style={{
                          background: "#f5a524",
                        }}
                      />

                      {t.investmentScam}

                      <b>
                        28%
                      </b>

                    </div>


                    <div className="legend-item">

                      <span
                        className="legend-dot"
                        style={{
                          background: "#8a63f0",
                        }}
                      />

                      {t.refundScam}

                      <b>
                        18%
                      </b>

                    </div>


                    <div className="legend-item">

                      <span
                        className="legend-dot"
                        style={{
                          background: "#e5484d",
                        }}
                      />

                      {t.digitalArrest}

                      <b>
                        8%
                      </b>

                    </div>


                    <div className="legend-item">

                      <span
                        className="legend-dot"
                        style={{
                          background: "#9fa3b8",
                        }}
                      />

                      {t.other}

                      <b>
                        5%
                      </b>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  FRAUD HEATMAP
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>
                    {t.fraudActivityHeatmap}
                  </h3>

                  <a href="#">
                    {t.viewMap}
                  </a>

                </div>


                <div className="map-box">

                  <div className="map-controls">

                    <span>
                      +
                    </span>

                    <span>
                      −
                    </span>

                  </div>


                  <div
                    className="heat-dot"
                    style={{
                      top: "30%",
                      left: "35%",
                      background:
                        "radial-gradient(circle,rgba(229,72,77,.9),transparent 70%)",
                      width: "36px",
                      height: "36px",
                    }}
                  />


                  <div
                    className="heat-dot"
                    style={{
                      top: "55%",
                      left: "55%",
                      background:
                        "radial-gradient(circle,rgba(229,72,77,.9),transparent 70%)",
                      width: "30px",
                      height: "30px",
                    }}
                  />


                  <div
                    className="heat-dot"
                    style={{
                      top: "40%",
                      left: "70%",
                      background:
                        "radial-gradient(circle,rgba(245,165,36,.85),transparent 70%)",
                      width: "26px",
                      height: "26px",
                    }}
                  />


                  <div
                    className="heat-dot"
                    style={{
                      top: "65%",
                      left: "25%",
                      background:
                        "radial-gradient(circle,rgba(245,165,36,.85),transparent 70%)",
                      width: "22px",
                      height: "22px",
                    }}
                  />


                  <div
                    className="heat-dot"
                    style={{
                      top: "20%",
                      left: "60%",
                      background:
                        "radial-gradient(circle,rgba(31,169,113,.7),transparent 70%)",
                      width: "18px",
                      height: "18px",
                    }}
                  />


                  <div className="map-legend">

                    <div>

                      <span
                        className="sq"
                        style={{
                          background: "var(--red)",
                        }}
                      />

                      {t.high}

                    </div>


                    <div>

                      <span
                        className="sq"
                        style={{
                          background: "var(--orange)",
                        }}
                      />

                      {t.medium}

                    </div>


                    <div>

                      <span
                        className="sq"
                        style={{
                          background: "var(--green)",
                        }}
                      />

                      {t.low}

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  SAFETY TIPS
              ================================================= */}

              <div className="panel">

                <div className="panel-head">

                  <h3>
                    {t.safetyTips}
                  </h3>

                </div>


                <div className="tips">


                  <div className="tip">

                    <div className="ic">
                      ✓
                    </div>

                    <div className="txt">

                      <div className="h">
                        {t.neverShare}
                      </div>

                      <div className="d">
                        {t.banksNeverAsk}
                      </div>

                    </div>

                  </div>


                  <div className="tip">

                    <div className="ic">
                      ✓
                    </div>

                    <div className="txt">

                      <div className="h">
                        {t.verifyBeforeTrust}
                      </div>

                      <div className="d">
                        {t.verifyCalls}
                      </div>

                    </div>

                  </div>


                  <div className="tip">

                    <div className="ic">
                      ✓
                    </div>

                    <div className="txt">

                      <div className="h">
                        {t.reportSuspicious}
                      </div>

                      <div className="d">
                        {t.helpProtect}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}