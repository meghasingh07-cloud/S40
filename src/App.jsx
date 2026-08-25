import React, { useState } from "react";
import Dashboard from "./Dashboard";
import PaymentSimulator from "./PaymentSimulator";
import RiskAnalysis from "./RiskAnalysis";
import ContextFusionMonitor from "./components/ContextFusionMonitor";

// Destinations that only exist as Dashboard-nested views (Dashboard's own
// sidebar hrefs use these exact keys). Every top-level page's sidebar
// (Dashboard's own, RiskAnalysis's, PaymentSimulator's) shares this same
// convention via the onNavigate prop, so clicking any of these from any
// page routes back to Dashboard with that section already open.
const DASHBOARD_SECTIONS = new Set([
  "dashboard",
  "transactions",
  "payment",
  "scam-detection",
  "scam-chain",
  "family-protection",
  "fraud-intelligence",
  "emergency",
  "settings",
]);

function App() {
  const [state, setState] = useState({
    currentPage: "dashboard",
    dashboardSection: null
  });

  function handleNavigate(destination) {
    if (destination === "risk-analysis" || destination === "payment-simulator") {
      setState({ currentPage: destination, dashboardSection: null });
      return;
    }
    if (DASHBOARD_SECTIONS.has(destination)) {
      // Batch both state updates together to avoid render jump
      setState({
        currentPage: "dashboard",
        dashboardSection: { section: destination, requestId: Date.now() + Math.random() }
      });
      return;
    }
    setState({ currentPage: destination, dashboardSection: null });
  }

  const currentPage = state.currentPage;
  const dashboardSection = state.dashboardSection;

  let page;

  if (currentPage === "risk-analysis") {
    page = (
      <RiskAnalysis
        onBack={() => handleNavigate("dashboard")}
        onNavigate={handleNavigate}
      />
    );
  } else if (currentPage === "make-payment" || currentPage === "payment-simulator") {
    page = (
      <PaymentSimulator
        onBack={() => handleNavigate("dashboard")}
        onNavigate={handleNavigate}
      />
    );
  } else {
    page = (
      <Dashboard
        onNavigate={handleNavigate}
        initialSection={dashboardSection}
      />
    );
  }

  return (
    <>
      {page}
      {/*
        Mounted once here, independent of which page is showing. It stays
        idle and renders nothing (returns null) until something calls
        emitPaymentInitiated(...) from contextFusion.js - see
        PaymentSimulator.jsx. Living at this level (rather than inside
        PaymentSimulator) means it survives navigation away from the
        payment screen while a decision is still in flight.
      */}
      <ContextFusionMonitor />
    </>
  );
}

export default App;