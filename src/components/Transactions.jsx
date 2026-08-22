import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Clock,
  User,
  X,
} from "lucide-react";

export default function Transactions({ onBack }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const transactions = [
    {
      id: "TXN-2026-00128",
      name: "Amazon Shopping",
      category: "Shopping",
      type: "PAYMENT",
      amount: 2499,
      direction: "DEBIT",
      date: "21 Aug 2026",
      time: "10:30 AM",
      status: "SAFE",
      riskScore: 8,
      method: "UPI",
      device: "Current Device",
      beneficiary: "Amazon Pay",
      description: "Routine shopping payment.",
      riskReason: "Known merchant and normal transaction pattern.",
    },
    {
      id: "TXN-2026-00127",
      name: "Rahul Kumar",
      category: "Transfer",
      type: "RECEIVED",
      amount: 5000,
      direction: "CREDIT",
      date: "21 Aug 2026",
      time: "09:15 AM",
      status: "SAFE",
      riskScore: 5,
      method: "UPI",
      device: "Current Device",
      beneficiary: "Rahul Kumar",
      description: "Money received from Rahul Kumar.",
      riskReason: "Known contact with previous transaction history.",
    },
    {
      id: "TXN-2026-00126",
      name: "New UPI Beneficiary",
      category: "Transfer",
      type: "PAYMENT",
      amount: 25000,
      direction: "DEBIT",
      date: "20 Aug 2026",
      time: "03:45 PM",
      status: "HIGH",
      riskScore: 87,
      method: "UPI",
      device: "Current Device",
      beneficiary: "New Beneficiary",
      description:
        "High-value payment attempted to a newly added beneficiary.",
      riskReason:
        "New beneficiary + unusual amount + no previous transaction history.",
    },
    {
      id: "TXN-2026-00125",
      name: "Netflix Subscription",
      category: "Entertainment",
      type: "PAYMENT",
      amount: 649,
      direction: "DEBIT",
      date: "20 Aug 2026",
      time: "07:20 PM",
      status: "SAFE",
      riskScore: 7,
      method: "UPI AutoPay",
      device: "Current Device",
      beneficiary: "Netflix",
      description: "Monthly subscription payment.",
      riskReason: "Recurring payment from a recognized merchant.",
    },
    {
      id: "TXN-2026-00124",
      name: "KYC Verification Account",
      category: "Suspicious",
      type: "PAYMENT",
      amount: 20000,
      direction: "DEBIT",
      date: "19 Aug 2026",
      time: "10:13 AM",
      status: "BLOCKED",
      riskScore: 96,
      method: "UPI",
      device: "Current Device",
      beneficiary: "Unknown Beneficiary",
      description:
        "Payment blocked after a connected scam sequence was detected.",
      riskReason:
        "Suspicious call + KYC message + suspicious link + new beneficiary.",
    },
    {
      id: "TXN-2026-00123",
      name: "Salary Credit",
      category: "Income",
      type: "RECEIVED",
      amount: 45000,
      direction: "CREDIT",
      date: "15 Aug 2026",
      time: "09:00 AM",
      status: "SAFE",
      riskScore: 2,
      method: "Bank Transfer",
      device: "Bank",
      beneficiary: "Employer",
      description: "Monthly salary credit.",
      riskReason: "Expected recurring income transaction.",
    },
    {
      id: "TXN-2026-00122",
      name: "Flipkart",
      category: "Shopping",
      type: "PAYMENT",
      amount: 3299,
      direction: "DEBIT",
      date: "14 Aug 2026",
      time: "06:25 PM",
      status: "SAFE",
      riskScore: 11,
      method: "UPI",
      device: "Current Device",
      beneficiary: "Flipkart",
      description: "Online shopping payment.",
      riskReason: "Recognized merchant and normal spending behaviour.",
    },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.name.toLowerCase().includes(search.toLowerCase()) ||
        transaction.category.toLowerCase().includes(search.toLowerCase()) ||
        transaction.id.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" || transaction.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const safeCount = transactions.filter(
    (t) => t.status === "SAFE"
  ).length;

  const highCount = transactions.filter(
    (t) => t.status === "HIGH"
  ).length;

  const blockedCount = transactions.filter(
    (t) => t.status === "BLOCKED"
  ).length;

  const totalAmount = transactions
    .filter((t) => t.direction === "DEBIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const formatAmount = (amount) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const getStatusStyle = (status) => {
    if (status === "SAFE") {
      return {
        background: "#eaf8f1",
        color: "#16865a",
        icon: <ShieldCheck size={13} />,
      };
    }

    if (status === "HIGH") {
      return {
        background: "#fff4e6",
        color: "#d88400",
        icon: <ShieldAlert size={13} />,
      };
    }

    return {
      background: "#fff0f1",
      color: "#d9363e",
      icon: <ShieldX size={13} />,
    };
  };

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
            PAYMENT ACTIVITY
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "27px",
              fontWeight: 750,
              letterSpacing: "-0.5px",
            }}
          >
            Transactions
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "13px",
              color: "#7d8291",
            }}
          >
            View and monitor all transactions associated with your account.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <SummaryCard
          icon={<CreditCard size={19} />}
          title="Total Transactions"
          value={transactions.length}
          subtitle={`₹${totalAmount.toLocaleString("en-IN")} sent`}
          background="#eef3ff"
          color="#3b6fe0"
        />

        <SummaryCard
          icon={<ShieldCheck size={19} />}
          title="Safe"
          value={safeCount}
          subtitle="No immediate concern"
          background="#eaf8f1"
          color="#1fa971"
        />

        <SummaryCard
          icon={<ShieldAlert size={19} />}
          title="Flagged"
          value={highCount}
          subtitle="Requires attention"
          background="#fff4e6"
          color="#d88400"
        />

        <SummaryCard
          icon={<ShieldX size={19} />}
          title="Blocked"
          value={blockedCount}
          subtitle="FraudShield intervened"
          background="#fff0f1"
          color="#e5484d"
        />
      </div>

      {/* TRANSACTION PANEL */}
      <div
        style={{
          background: "white",
          border: "1px solid #e7e9ef",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* TOOLBAR */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #eef0f4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 750,
              }}
            >
              All Transactions
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#858997",
                marginTop: "3px",
              }}
            >
              {filteredTransactions.length} transactions displayed
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {/* SEARCH */}
            <div
              style={{
                width: "220px",
                height: "38px",
                border: "1px solid #e1e4eb",
                borderRadius: "9px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 11px",
                boxSizing: "border-box",
              }}
            >
              <Search size={16} color="#9296a3" />

              <input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search transactions..."
  style={{
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "12px",
    color: "#343842",
    background: "transparent",
    boxShadow: "none",
    appearance: "none",
  }}
/>
            </div>

            {/* FILTER */}
            <div
              style={{
                position: "relative",
              }}
            >
              <Filter
                size={15}
                color="#777b87"
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "11px",
                }}
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 32px 0 32px",
                  border: "1px solid #e1e4eb",
                  borderRadius: "9px",
                  background: "white",
                  fontSize: "12px",
                  color: "#343842",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Status</option>
                <option value="SAFE">Safe</option>
                <option value="HIGH">Flagged</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2.2fr 1fr 1fr 1fr 1.1fr 32px",
            padding: "11px 20px",
            background: "#fafbfc",
            borderBottom: "1px solid #eef0f4",
            fontSize: "10px",
            fontWeight: 800,
            color: "#858997",
            letterSpacing: ".4px",
          }}
        >
          <div>TRANSACTION</div>
          <div>DATE</div>
          <div>AMOUNT</div>
          <div>TYPE</div>
          <div>RISK</div>
          <div></div>
        </div>

        {/* TRANSACTIONS */}
        {filteredTransactions.length === 0 ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#858997",
              fontSize: "13px",
            }}
          >
            No transactions found.
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const statusStyle = getStatusStyle(transaction.status);

            return (
              <div
                key={transaction.id}
                onClick={() =>
                  setSelectedTransaction(transaction)
                }
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2.2fr 1fr 1fr 1fr 1.1fr 32px",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: "1px solid #f0f1f4",
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fafbfc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
                {/* TRANSACTION */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background:
                        transaction.direction === "CREDIT"
                          ? "#eaf8f1"
                          : "#eef3ff",
                      color:
                        transaction.direction === "CREDIT"
                          ? "#1fa971"
                          : "#3b6fe0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {transaction.direction === "CREDIT" ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#343842",
                      }}
                    >
                      {transaction.name}
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        color: "#858997",
                        marginTop: "3px",
                      }}
                    >
                      {transaction.category} • {transaction.method}
                    </div>
                  </div>
                </div>

                {/* DATE */}
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#454954",
                    }}
                  >
                    {transaction.date}
                  </div>

                  <div
                    style={{
                      fontSize: "10px",
                      color: "#999daa",
                      marginTop: "3px",
                    }}
                  >
                    {transaction.time}
                  </div>
                </div>

                {/* AMOUNT */}
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 750,
                    color:
                      transaction.direction === "CREDIT"
                        ? "#1fa971"
                        : "#343842",
                  }}
                >
                  {transaction.direction === "CREDIT"
                    ? "+"
                    : "-"}{" "}
                  {formatAmount(transaction.amount)}
                </div>

                {/* TYPE */}
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#686d79",
                  }}
                >
                  {transaction.type === "RECEIVED"
                    ? "Received"
                    : "Payment"}
                </div>

                {/* RISK */}
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 8px",
                      borderRadius: "7px",
                      background: statusStyle.background,
                      color: statusStyle.color,
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    {statusStyle.icon}
                    {transaction.status}
                  </span>
                </div>

                <div>
                  <ChevronDown
                    size={15}
                    color="#9a9eaa"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTNOTE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginTop: "14px",
          fontSize: "10px",
          color: "#858997",
        }}
      >
        <ShieldCheck size={13} color="#1fa971" />
        FraudShield continuously monitors transactions for suspicious
        activity.
      </div>

      {/* DETAIL MODAL */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          formatAmount={formatAmount}
        />
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  background,
  color,
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e7e9ef",
        borderRadius: "14px",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          background,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#858997",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
          marginTop: "3px",
          letterSpacing: "-.5px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "#858997",
          marginTop: "4px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTION DETAILS
========================================================= */

function TransactionDetails({
  transaction,
  onClose,
  formatAmount,
}) {
  const statusColor =
    transaction.status === "SAFE"
      ? "#1fa971"
      : transaction.status === "HIGH"
      ? "#d88400"
      : "#e5484d";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,23,30,.38)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "430px",
          maxWidth: "92vw",
          height: "100%",
          background: "white",
          boxShadow: "-10px 0 35px rgba(0,0,0,.12)",
          padding: "26px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#858997",
                letterSpacing: ".7px",
              }}
            >
              TRANSACTION DETAILS
            </div>

            <div
              style={{
                fontSize: "17px",
                fontWeight: 750,
                marginTop: "4px",
              }}
            >
              {transaction.id}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              border: "1px solid #e4e6ed",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* AMOUNT */}
        <div
          style={{
            background: "#f7f8fb",
            borderRadius: "14px",
            padding: "22px",
            textAlign: "center",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#858997",
            }}
          >
            {transaction.direction === "CREDIT"
              ? "Amount Received"
              : "Amount Paid"}
          </div>

          <div
            style={{
              fontSize: "31px",
              fontWeight: 800,
              marginTop: "6px",
              color:
                transaction.direction === "CREDIT"
                  ? "#1fa971"
                  : "#343842",
            }}
          >
            {transaction.direction === "CREDIT" ? "+" : "-"}
            {formatAmount(transaction.amount)}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "10px",
              padding: "6px 10px",
              borderRadius: "20px",
              background: `${statusColor}15`,
              color: statusColor,
              fontSize: "10px",
              fontWeight: 800,
            }}
          >
            {transaction.status === "SAFE" && (
              <ShieldCheck size={13} />
            )}

            {transaction.status === "HIGH" && (
              <ShieldAlert size={13} />
            )}

            {transaction.status === "BLOCKED" && (
              <ShieldX size={13} />
            )}

            {transaction.status}
          </div>
        </div>

        {/* RISK SCORE */}
        <div
          style={{
            border: "1px solid #e7e9ef",
            borderRadius: "13px",
            padding: "16px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "9px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Fraud Risk Score
            </span>

            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: statusColor,
              }}
            >
              {transaction.riskScore}/100
            </span>
          </div>

          <div
            style={{
              height: "7px",
              background: "#edf0f4",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${transaction.riskScore}%`,
                background: statusColor,
                borderRadius: "10px",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "10px",
              fontSize: "10px",
              lineHeight: 1.5,
              color: "#777b87",
            }}
          >
            {transaction.riskReason}
          </div>
        </div>

        {/* INFORMATION */}
        <div
          style={{
            border: "1px solid #e7e9ef",
            borderRadius: "13px",
            padding: "16px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 750,
              marginBottom: "13px",
            }}
          >
            Transaction Information
          </div>

          <InfoRow
            icon={<User size={14} />}
            label="Recipient / Sender"
            value={transaction.beneficiary}
          />

          <InfoRow
            icon={<Clock size={14} />}
            label="Date & Time"
            value={`${transaction.date} • ${transaction.time}`}
          />

          <InfoRow
            icon={<CreditCard size={14} />}
            label="Payment Method"
            value={transaction.method}
          />

          <InfoRow
            icon={<Smartphone size={14} />}
            label="Device"
            value={transaction.device}
          />
        </div>

        {/* DESCRIPTION */}
        <div
          style={{
            background:
              transaction.status === "BLOCKED"
                ? "#fff4f4"
                : "#f7f9fd",
            borderRadius: "12px",
            padding: "15px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: statusColor,
              marginBottom: "5px",
            }}
          >
            FRAUDSHIELD ANALYSIS
          </div>

          <div
            style={{
              fontSize: "11px",
              lineHeight: 1.6,
              color: "#626774",
            }}
          >
            {transaction.description}
          </div>
        </div>

        {/* BLOCKED MESSAGE */}
        {transaction.status === "BLOCKED" && (
          <div
            style={{
              marginTop: "14px",
              padding: "13px",
              borderRadius: "10px",
              background: "#fff0f1",
              border: "1px solid #f3c5c7",
              color: "#b82f38",
              fontSize: "10px",
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            🛡️ FraudShield intervention prevented this transaction
            from proceeding.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid #f0f1f4",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "7px",
          background: "#f5f6f9",
          color: "#686d79",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "9px",
            color: "#858997",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#343842",
            marginTop: "2px",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}