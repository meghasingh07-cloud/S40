import React, { useState } from "react";
import Dashboard from "./Dashboard";
import PaymentSimulator from "./PaymentSimulator";
import ContextFusionMonitor from "./components/ContextFusionMonitor";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  let page;

  if (currentPage === "risk-analysis") {
    page = (
      <RiskAnalysis
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  } else if (currentPage === "make-payment" || currentPage === "payment-simulator") {
    page = (
      <PaymentSimulator
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  } else {
    page = (
      <Dashboard
        onNavigate={(page) => setCurrentPage(page)}
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