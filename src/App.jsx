
import React, { useState } from "react";
import Dashboard from "./Dashboard";
import PaymentSimulator from "./PaymentSimulator";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (currentPage === "risk-analysis") {
    return (
      <RiskAnalysis
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  if (currentPage === "make-payment" || currentPage === "payment-simulator") {
    return (
      <PaymentSimulator
        onBack={() => setCurrentPage("dashboard")}
      />
    );
  }

  return (
    <Dashboard
      onNavigate={(page) => setCurrentPage(page)}
    />
  );
}

export default App;
