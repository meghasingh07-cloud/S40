import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  Globe,
  Bell,
  ShieldCheck,
  CreditCard,
  Siren,
  Smartphone,
  HelpCircle,
  Info,
  ChevronRight,
  Check,
} from "lucide-react";

export default function Settings({
  onBack,
  onOpenFamilyProtection,
  language,
  setLanguage,
}) {
  const [notifications, setNotifications] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [familyAlerts, setFamilyAlerts] = useState(true);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("fraudshield-theme") === "dark"
  );

  const isHindi = language === "hi";

  /* =========================
     APPLY THEME
  ========================= */
  useEffect(() => {
    localStorage.setItem(
      "fraudshield-theme",
      darkMode ? "dark" : "light"
    );

    document.documentElement.style.setProperty(
      "--fs-bg",
      darkMode ? "#0f1117" : "#f6f8fc"
    );

    document.documentElement.style.setProperty(
      "--fs-card",
      darkMode ? "#171a23" : "#ffffff"
    );

    document.documentElement.style.setProperty(
      "--fs-text",
      darkMode ? "#f5f7fb" : "#171a21"
    );

    document.documentElement.style.setProperty(
      "--fs-muted",
      darkMode ? "#a8afbf" : "#737b8c"
    );

    document.documentElement.style.setProperty(
      "--fs-border",
      darkMode ? "#292e3b" : "#e6e9f0"
    );

    document.body.style.background = darkMode
      ? "#0f1117"
      : "#f6f8fc";

    document.body.style.color = darkMode
      ? "#f5f7fb"
      : "#171a21";
  }, [darkMode]);

  const t = {
    settings: isHindi ? "सेटिंग्स" : "Settings",

    manage: isHindi
      ? "अपने FraudShield अनुभव को प्रबंधित करें"
      : "Manage your FraudShield experience",

    account: isHindi ? "अकाउंट" : "Account",

    accountDesc: isHindi
      ? "अपनी प्रोफ़ाइल और अकाउंट जानकारी प्रबंधित करें"
      : "Manage your profile and account information",

    appearance: isHindi
      ? "दिखावट और भाषा"
      : "Appearance & Language",

    appearanceDesc: isHindi
      ? "ऐप की भाषा और दिखावट बदलें"
      : "Change app language and appearance",

    language: isHindi ? "भाषा" : "Language",

    english: "English",
    hindi: "हिन्दी",

    theme: isHindi ? "थीम" : "Theme",
    light: isHindi ? "लाइट" : "Light",
    dark: isHindi ? "डार्क" : "Dark",

    family: isHindi ? "परिवार सुरक्षा" : "Family Protection",

    familyDesc: isHindi
      ? "अपने परिवार के सदस्यों को धोखाधड़ी से सुरक्षित रखें"
      : "Protect your family members from fraud",

    notifications: isHindi ? "सूचनाएं" : "Notifications",

    notificationsDesc: isHindi
      ? "FraudShield अलर्ट और सूचनाएं प्रबंधित करें"
      : "Manage FraudShield alerts and notifications",

    allNotifications: isHindi
      ? "सभी सूचनाएं"
      : "All Notifications",

    paymentAlerts: isHindi
      ? "भुगतान अलर्ट"
      : "Payment Alerts",

    familyAlerts: isHindi
      ? "परिवार अलर्ट"
      : "Family Alerts",

    security: isHindi
      ? "सुरक्षा और गोपनीयता"
      : "Security & Privacy",

    securityDesc: isHindi
      ? "अपनी सुरक्षा और गोपनीयता सेटिंग्स प्रबंधित करें"
      : "Manage your security and privacy settings",

    payment: isHindi
      ? "भुगतान सुरक्षा"
      : "Payment Protection",

    paymentDesc: isHindi
      ? "भुगतान सुरक्षा और लेन-देन की सीमाएं प्रबंधित करें"
      : "Manage payment protection and transaction limits",

    emergency: isHindi
      ? "आपातकालीन प्राथमिकताएं"
      : "Emergency Preferences",

    emergencyDesc: isHindi
      ? "आपातकालीन संपर्क और सुरक्षा विकल्प सेट करें"
      : "Configure emergency contacts and safety options",

    devices: isHindi
      ? "विश्वसनीय डिवाइस"
      : "Trusted Devices",

    devicesDesc: isHindi
      ? "अपने विश्वसनीय डिवाइस देखें और प्रबंधित करें"
      : "View and manage your trusted devices",

    permissions: isHindi
      ? "ऐप अनुमतियां"
      : "App Permissions",

    permissionsDesc: isHindi
      ? "ऐप की अनुमतियां प्रबंधित करें"
      : "Manage app permissions",

    help: isHindi
      ? "सहायता और सपोर्ट"
      : "Help & Support",

    helpDesc: isHindi
      ? "सहायता प्राप्त करें या किसी समस्या की रिपोर्ट करें"
      : "Get help or report an issue",

    about: isHindi
      ? "FraudShield के बारे में"
      : "About FraudShield",

    aboutDesc: isHindi
      ? "ऐप की जानकारी और संस्करण देखें"
      : "View app information and version",

    protected: isHindi
      ? "आपका अकाउंट सुरक्षित है"
      : "Your account is protected",

    version: isHindi ? "संस्करण 1.0.0" : "Version 1.0.0",
  };

  const pageStyle = {
    minHeight: "100%",
    padding: "28px 32px 40px",
    background: "var(--fs-bg)",
    color: "var(--fs-text)",
    transition: "background 0.25s ease, color 0.25s ease",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: "var(--fs-card)",
    border: "1px solid var(--fs-border)",
    borderRadius: "16px",
    transition: "background 0.25s ease, border 0.25s ease",
  };

  const descriptionStyle = {
    color: "var(--fs-muted)",
  };

  return (
    <div style={pageStyle}>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            border: "1px solid var(--fs-border)",
            background: "var(--fs-card)",
            color: "var(--fs-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--fs-text)",
            }}
          >
            {t.settings}
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "14px",
              ...descriptionStyle,
            }}
          >
            {t.manage}
          </p>
        </div>
      </div>

      {/* SECURITY STATUS */}
      <div
        style={{
          ...cardStyle,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "28px",
          background: darkMode ? "#13251e" : "#f0faf5",
          borderColor: darkMode ? "#20533e" : "#d5f0e2",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "#dff6ea",
            color: "#1fa971",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={24} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 650,
              color: "var(--fs-text)",
              marginBottom: "4px",
            }}
          >
            {t.protected}
          </div>

          <div
            style={{
              fontSize: "13px",
              ...descriptionStyle,
            }}
          >
            {isHindi
              ? "FraudShield आपके अकाउंट की सक्रिय रूप से निगरानी कर रहा है।"
              : "FraudShield is actively monitoring your account."}
          </div>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#1fa971",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={18} />
        </div>
      </div>

      {/* ACCOUNT */}
      <Section title={t.account}>
        <div
          style={{
            ...cardStyle,
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <IconBox type="blue">
            <User size={21} />
          </IconBox>

          <div style={{ flex: 1 }}>
            <div style={titleStyle}>Megha</div>

            <div style={descriptionStyle}>
              megha@example.com
            </div>
          </div>

          <ChevronRight
            size={19}
            color="var(--fs-muted)"
          />
        </div>
      </Section>

      {/* APPEARANCE */}
      <Section title={t.appearance}>
        <div
          style={{
            ...cardStyle,
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <IconBox type="purple">
              <Globe size={21} />
            </IconBox>

            <div>
              <div style={titleStyle}>
                {t.appearance}
              </div>

              <div style={descriptionStyle}>
                {t.appearanceDesc}
              </div>
            </div>
          </div>

          {/* LANGUAGE */}
          <div style={{ marginBottom: "24px" }}>
            <div style={controlLabel}>
              {t.language}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <ChoiceButton
                selected={language === "en"}
                onClick={() => setLanguage("en")}
              >
                🇬🇧 {t.english}
                {language === "en" && (
                  <Check size={16} />
                )}
              </ChoiceButton>

              <ChoiceButton
                selected={language === "hi"}
                onClick={() => setLanguage("hi")}
              >
                🇮🇳 {t.hindi}
                {language === "hi" && (
                  <Check size={16} />
                )}
              </ChoiceButton>
            </div>
          </div>

          {/* THEME */}
          <div>
            <div style={controlLabel}>
              {t.theme}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <ChoiceButton
                selected={!darkMode}
                onClick={() => setDarkMode(false)}
              >
                ☀️ {t.light}

                {!darkMode && (
                  <Check size={16} />
                )}
              </ChoiceButton>

              <ChoiceButton
                selected={darkMode}
                onClick={() => setDarkMode(true)}
              >
                🌙 {t.dark}

                {darkMode && (
                  <Check size={16} />
                )}
              </ChoiceButton>
            </div>
          </div>
        </div>
      </Section>

      {/* FAMILY */}
      <Section title={t.family}>
        <div
          onClick={onOpenFamilyProtection}
          style={{
            ...cardStyle,
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
        >
          <IconBox type="purple">
            👪
          </IconBox>

          <div style={{ flex: 1 }}>
            <div style={titleStyle}>
              {t.family}
            </div>

            <div style={descriptionStyle}>
              {t.familyDesc}
            </div>
          </div>

          <ChevronRight
            size={19}
            color="var(--fs-muted)"
          />
        </div>
      </Section>

      {/* NOTIFICATIONS */}
      <Section title={t.notifications}>
        <div
          style={{
            ...cardStyle,
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <IconBox type="orange">
              <Bell size={21} />
            </IconBox>

            <div>
              <div style={titleStyle}>
                {t.notifications}
              </div>

              <div style={descriptionStyle}>
                {t.notificationsDesc}
              </div>
            </div>
          </div>

          <Toggle
            label={t.allNotifications}
            value={notifications}
            setValue={setNotifications}
          />

          <Toggle
            label={t.paymentAlerts}
            value={paymentAlerts}
            setValue={setPaymentAlerts}
          />

          <Toggle
            label={t.familyAlerts}
            value={familyAlerts}
            setValue={setFamilyAlerts}
          />
        </div>
      </Section>

      {/* SECURITY & PREFERENCES */}
      <Section
        title={
          isHindi
            ? "सुरक्षा और प्राथमिकताएं"
            : "Security & Preferences"
        }
      >
        <SettingsItem
          icon={<ShieldCheck size={21} />}
          iconClass="green"
          title={t.security}
          description={t.securityDesc}
        />

        <SettingsItem
          icon={<CreditCard size={21} />}
          iconClass="blue"
          title={t.payment}
          description={t.paymentDesc}
        />

        <SettingsItem
          icon={<Siren size={21} />}
          iconClass="red"
          title={t.emergency}
          description={t.emergencyDesc}
        />

        <SettingsItem
          icon={<Smartphone size={21} />}
          iconClass="purple"
          title={t.devices}
          description={t.devicesDesc}
        />

        <SettingsItem
          icon={<ShieldCheck size={21} />}
          iconClass="orange"
          title={t.permissions}
          description={t.permissionsDesc}
        />
      </Section>

      {/* SUPPORT */}
      <Section
        title={isHindi ? "सहायता" : "Support"}
      >
        <SettingsItem
          icon={<HelpCircle size={21} />}
          iconClass="blue"
          title={t.help}
          description={t.helpDesc}
        />

        <SettingsItem
          icon={<Info size={21} />}
          iconClass="gray"
          title={t.about}
          description={t.aboutDesc}
        />
      </Section>

      {/* FOOTER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "25px 0 10px",
          color: "var(--fs-muted)",
          fontSize: "12px",
        }}
      >
        <ShieldCheck size={17} />
        <span>
          FraudShield • {t.version}
        </span>
      </div>
    </div>
  );
}


/* =========================
   SECTION
========================= */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--fs-text)",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}


/* =========================
   ICON BOX
========================= */

function IconBox({ type, children }) {
  const colors = {
    blue: ["#e8f0ff", "#3b6fe0"],
    purple: ["#eee9ff", "#8a63f0"],
    orange: ["#fff1dc", "#f5a524"],
    green: ["#e3f8ed", "#1fa971"],
    red: ["#ffe7e8", "#e5484d"],
    gray: ["#eceef3", "#737b8c"],
  };

  const [background, color] =
    colors[type] || colors.gray;

  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        flexShrink: 0,
        borderRadius: "12px",
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
      }}
    >
      {children}
    </div>
  );
}


/* =========================
   CHOICE BUTTON
========================= */

function ChoiceButton({
  selected,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: "125px",
        padding: "11px 14px",
        borderRadius: "10px",
        border: selected
          ? "1px solid #3b6fe0"
          : "1px solid var(--fs-border)",
        background: selected
          ? "rgba(59,111,224,0.10)"
          : "var(--fs-card)",
        color: selected
          ? "#3b6fe0"
          : "var(--fs-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: selected ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}


/* =========================
   TOGGLE
========================= */

function Toggle({
  label,
  value,
  setValue,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 0",
        borderTop: "1px solid var(--fs-border)",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          color: "var(--fs-text)",
        }}
      >
        {label}
      </span>

      <button
        onClick={() => setValue(!value)}
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "20px",
          border: "none",
          background: value
            ? "#3b6fe0"
            : darkGray(),
          padding: "3px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: value
            ? "flex-end"
            : "flex-start",
        }}
      >
        <span
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow:
              "0 1px 4px rgba(0,0,0,.25)",
          }}
        />
      </button>
    </div>
  );
}

function darkGray() {
  return "#697080";
}


/* =========================
   SETTINGS ITEM
========================= */

function SettingsItem({
  icon,
  iconClass,
  title,
  description,
}) {
  return (
    <div
      style={{
        background: "var(--fs-card)",
        border: "1px solid var(--fs-border)",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "10px",
        cursor: "pointer",
      }}
    >
      <IconBox type={iconClass}>
        {icon}
      </IconBox>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 650,
            color: "var(--fs-text)",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "var(--fs-muted)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>

      <ChevronRight
        size={19}
        color="var(--fs-muted)"
      />
    </div>
  );
}

const titleStyle = {
  fontSize: "14px",
  fontWeight: 650,
  color: "var(--fs-text)",
  marginBottom: "4px",
};

const controlLabel = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--fs-text)",
  marginBottom: "10px",
};