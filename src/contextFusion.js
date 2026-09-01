const API = import.meta.env.VITE_FRAUDSHIELD_API || "/api/ai";

function authHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("fraudshield-token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`FraudShield AI ${response.status}: ${body || response.statusText}`);
  }
  return response.json();
}

export function analyzeAccount() {
  return request("/account-analysis");
}

export function analyzePaymentInitial(payload) {
  return request("/payment-initial", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function analyzePaymentPipeline(payload) {
  return request("/payment-analysis", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function analyzeVoice(transcript, language = "en-IN") {
  return request("/voice-analysis", {
    method: "POST",
    body: JSON.stringify({ transcript, language })
  });
}

export function analyzeMessage(text) {
  return request("/message-analysis", {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export function emitAccountAnalysis() {
  window.dispatchEvent(new CustomEvent("contextfusion:account:analysis"));
}

export function emitPaymentInitiated(payload) {
  window.dispatchEvent(new CustomEvent("contextfusion:payment:initiated", { detail: payload }));
}

export function emitPaymentInitialVerification(payload) {
  window.dispatchEvent(new CustomEvent("contextfusion:payment:initial-verification", { detail: payload }));
}

export function emitMessageReceived(text) {
  window.dispatchEvent(new CustomEvent("contextfusion:message:received", { detail: { text } }));
}

export function emitCallTranscript(transcript, language = "en-IN") {
  window.dispatchEvent(new CustomEvent("contextfusion:call:transcript", { detail: { transcript, language } }));
}