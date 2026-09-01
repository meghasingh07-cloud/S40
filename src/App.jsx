import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import PaymentSimulator from "./PaymentSimulator";
import RiskAnalysis from "./RiskAnalysis";
import ContextFusionMonitor from "./components/ContextFusionMonitor";
import AuthGate from "./AuthGate";

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
  "scam-intelligence",
  "emergency",
  "settings",
]);

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [state, setState] = useState({
    currentPage: "dashboard",
    dashboardSection: null
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setAuthChecking(false); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) throw new Error("invalid-session");
        return r.json();
      })
      .then(data => { localStorage.setItem("fraudshield-user", JSON.stringify(data.user)); setAuthenticated(true); })
      .catch(() => {
        ["token", "fraudshield-token", "authToken", "accessToken", "fraudshield-user"].forEach(k => localStorage.removeItem(k));
        setAuthenticated(false);
      })
      .finally(() => setAuthChecking(false));

    const logout = () => {
      ["token", "fraudshield-token", "authToken", "accessToken", "fraudshield-user"].forEach(k => localStorage.removeItem(k));
      setAuthenticated(false);
    };
    window.addEventListener("fraudshield:logout", logout);
    return () => window.removeEventListener("fraudshield:logout", logout);
  }, []);

  function handleNavigate(destination) {
    // IMPORTANT: every Make a Payment entry point must use the live AI
    // payment pipeline. The legacy Dashboard payment demo is intentionally
    // bypassed so clicking Make a Payment always starts Score #1.
    if (destination === "payment" || destination === "make-payment" || destination === "payment-simulator") {
      setState({ currentPage: "payment-simulator", dashboardSection: null });
      return;
    }
    if (destination === "risk-analysis") {
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

  if (authChecking) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"Inter, sans-serif",color:"#536079",background:"#f4f7fb"}}>Checking secure session…</div>;
  if (!authenticated) return <AuthGate onAuthenticated={() => setAuthenticated(true)} />;

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