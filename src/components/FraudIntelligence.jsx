import React, { useState } from "react";
import "./FraudIntelligence.css";

export default function FraudIntelligence({ onBack }) {
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (search.trim()) {
      setSearched(true);
    }
  };

  return (
    <div className="fi-page">

      {/* HEADER */}
      <div className="fi-header">
        <div>
          <button className="fi-back" onClick={onBack}>
            ← Back to Dashboard
          </button>

          <div className="fi-eyebrow">
            FRAUDSHIELD INTELLIGENCE
          </div>

          <h1>Fraud Intelligence</h1>

          <p>
            Monitor emerging fraud patterns, scam trends and threat signals
            across digital payment channels.
          </p>
        </div>

        <div className="fi-status">
          <span className="fi-status-dot"></span>
          Intelligence System Active
        </div>
      </div>

      {/* SEARCH */}
      <div className="fi-search-card">

        <div className="fi-search-title">
          🔎 Investigate a Threat
        </div>

        <div className="fi-search-subtitle">
          Search a phone number, UPI ID, URL, keyword or suspicious entity.
        </div>

        <div className="fi-search-row">
          <input
            type="text"
            placeholder="e.g. suspicious@upi, +91 XXXXX XXXXX, URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearched(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button onClick={handleSearch}>
            Investigate
          </button>
        </div>

        {searched && (
          <div className="fi-search-result">

            <div className="fi-result-icon">
              ⚠️
            </div>

            <div>
              <strong>Potentially Suspicious Signal Detected</strong>

              <p>
                The submitted indicator matches patterns associated with
                reported fraud activity. Verify the source before interacting.
              </p>
            </div>

            <span className="fi-high-badge">
              HIGH RISK
            </span>

          </div>
        )}

      </div>

      {/* OVERVIEW */}
      <div className="fi-section-title">
        <div>
          <h2>Threat Overview</h2>
          <p>Current simulated intelligence signals</p>
        </div>

        <span className="fi-updated">
          ● Updated just now
        </span>
      </div>

      <div className="fi-stats">

        <div className="fi-stat">
          <div className="fi-stat-icon blue">
            🌐
          </div>

          <div>
            <span>Active Threats</span>
            <strong>1,284</strong>
            <small>↑ 14.8% this week</small>
          </div>
        </div>

        <div className="fi-stat">
          <div className="fi-stat-icon red">
            🚨
          </div>

          <div>
            <span>High Risk Signals</span>
            <strong>327</strong>
            <small>↑ 8.2% this week</small>
          </div>
        </div>

        <div className="fi-stat">
          <div className="fi-stat-icon orange">
            📱
          </div>

          <div>
            <span>Reported Today</span>
            <strong>186</strong>
            <small>Across all channels</small>
          </div>
        </div>

        <div className="fi-stat">
          <div className="fi-stat-icon green">
            🛡️
          </div>

          <div>
            <span>Threats Blocked</span>
            <strong>94.6%</strong>
            <small>Protection effectiveness</small>
          </div>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="fi-main-grid">

        {/* TRENDING SCAMS */}
        <div className="fi-card">

          <div className="fi-card-header">
            <div>
              <h3>🔥 Trending Scam Patterns</h3>
              <p>Fraud patterns showing increased activity</p>
            </div>

            <span className="fi-live">
              LIVE
            </span>
          </div>

          <div className="fi-threat-list">

            <div className="fi-threat">
              <div className="fi-threat-number">
                01
              </div>

              <div className="fi-threat-content">
                <strong>Digital Arrest Scam</strong>
                <span>
                  Fake police / government officials demanding money
                </span>

                <div className="fi-mini-bar">
                  <div style={{ width: "89%" }}></div>
                </div>
              </div>

              <div className="fi-threat-percent">
                89%
              </div>
            </div>

            <div className="fi-threat">
              <div className="fi-threat-number">
                02
              </div>

              <div className="fi-threat-content">
                <strong>Fake KYC Update</strong>
                <span>
                  Fraudulent links requesting account verification
                </span>

                <div className="fi-mini-bar">
                  <div style={{ width: "76%" }}></div>
                </div>
              </div>

              <div className="fi-threat-percent">
                76%
              </div>
            </div>

            <div className="fi-threat">
              <div className="fi-threat-number">
                03
              </div>

              <div className="fi-threat-content">
                <strong>Investment Scam</strong>
                <span>
                  Fake trading platforms and guaranteed returns
                </span>

                <div className="fi-mini-bar">
                  <div style={{ width: "64%" }}></div>
                </div>
              </div>

              <div className="fi-threat-percent">
                64%
              </div>
            </div>

            <div className="fi-threat">
              <div className="fi-threat-number">
                04
              </div>

              <div className="fi-threat-content">
                <strong>UPI Refund Scam</strong>
                <span>
                  Fake refund requests and payment collection tricks
                </span>

                <div className="fi-mini-bar">
                  <div style={{ width: "51%" }}></div>
                </div>
              </div>

              <div className="fi-threat-percent">
                51%
              </div>
            </div>

          </div>

        </div>

        {/* CHANNEL ANALYSIS */}
        <div className="fi-card">

          <div className="fi-card-header">
            <div>
              <h3>📡 Attack Channels</h3>
              <p>How scams are reaching users</p>
            </div>
          </div>

          <div className="fi-channel-list">

            <div className="fi-channel">
              <div className="fi-channel-left">
                <span className="fi-channel-icon whatsapp">
                  💬
                </span>

                <div>
                  <strong>WhatsApp</strong>
                  <span>42% of detected activity</span>
                </div>
              </div>

              <strong>42%</strong>
            </div>

            <div className="fi-channel">
              <div className="fi-channel-left">
                <span className="fi-channel-icon call">
                  📞
                </span>

                <div>
                  <strong>Phone Calls</strong>
                  <span>27% of detected activity</span>
                </div>
              </div>

              <strong>27%</strong>
            </div>

            <div className="fi-channel">
              <div className="fi-channel-left">
                <span className="fi-channel-icon sms">
                  💬
                </span>

                <div>
                  <strong>SMS</strong>
                  <span>18% of detected activity</span>
                </div>
              </div>

              <strong>18%</strong>
            </div>

            <div className="fi-channel">
              <div className="fi-channel-left">
                <span className="fi-channel-icon email">
                  ✉️
                </span>

                <div>
                  <strong>Email</strong>
                  <span>13% of detected activity</span>
                </div>
              </div>

              <strong>13%</strong>
            </div>

          </div>

        </div>

      </div>

      {/* SECOND ROW */}
      <div className="fi-bottom-grid">

        {/* HOTSPOTS */}
        <div className="fi-card">

          <div className="fi-card-header">
            <div>
              <h3>📍 Fraud Hotspots</h3>
              <p>Regions with elevated fraud activity</p>
            </div>
          </div>

          <div className="fi-hotspots">

            <div className="fi-location high">
              <div className="fi-location-rank">
                01
              </div>

              <div className="fi-location-info">
                <strong>Maharashtra</strong>
                <span>High activity</span>
              </div>

              <div className="fi-location-score">
                91
              </div>
            </div>

            <div className="fi-location high">
              <div className="fi-location-rank">
                02
              </div>

              <div className="fi-location-info">
                <strong>Delhi NCR</strong>
                <span>High activity</span>
              </div>

              <div className="fi-location-score">
                86
              </div>
            </div>

            <div className="fi-location medium">
              <div className="fi-location-rank">
                03
              </div>

              <div className="fi-location-info">
                <strong>Karnataka</strong>
                <span>Moderate activity</span>
              </div>

              <div className="fi-location-score">
                72
              </div>
            </div>

            <div className="fi-location medium">
              <div className="fi-location-rank">
                04
              </div>

              <div className="fi-location-info">
                <strong>West Bengal</strong>
                <span>Moderate activity</span>
              </div>

              <div className="fi-location-score">
                68
              </div>
            </div>

          </div>

        </div>

        {/* RECENT INTELLIGENCE */}
        <div className="fi-card">

          <div className="fi-card-header">
            <div>
              <h3>🧠 Recent Intelligence</h3>
              <p>Newly identified threat patterns</p>
            </div>

            <button className="fi-view-all">
              View All
            </button>
          </div>

          <div className="fi-intelligence-list">

            <div className="fi-intelligence">
              <span className="fi-intel-icon red">
                !
              </span>

              <div>
                <strong>Fake Banking Support Numbers</strong>
                <p>
                  Fraudsters are impersonating customer support agents.
                </p>
                <small>12 minutes ago</small>
              </div>
            </div>

            <div className="fi-intelligence">
              <span className="fi-intel-icon orange">
                ⚠
              </span>

              <div>
                <strong>Fake Cashback Campaign</strong>
                <p>
                  Increased reports of reward links requesting UPI payments.
                </p>
                <small>38 minutes ago</small>
              </div>
            </div>

            <div className="fi-intelligence">
              <span className="fi-intel-icon blue">
                🔎
              </span>

              <div>
                <strong>New KYC Phishing Pattern</strong>
                <p>
                  Attackers are using shortened URLs to mimic banking pages.
                </p>
                <small>1 hour ago</small>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SAFETY INTELLIGENCE */}
      <div className="fi-alert">

        <div className="fi-alert-icon">
          🛡️
        </div>

        <div>
          <strong>Intelligence Insight</strong>

          <p>
            FraudShield has detected a rise in impersonation-based scams.
            Never transfer money or share OTPs solely because someone claims
            to be from a bank, police department or government agency.
          </p>
        </div>

        <button onClick={onBack}>
          Stay Protected →
        </button>

      </div>

    </div>
  );
}