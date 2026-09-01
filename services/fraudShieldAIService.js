const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const AI_URL = process.env.FRAUDSHIELD_AI_URL || "http://127.0.0.1:8000";

function toHoursAgo(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / 3600000);
}

function normalizeTransaction(row) {
  const created = row.createdAt || row.updatedAt || new Date();
  return {
    id: String(row._id || ""),
    timestamp: new Date(created).toISOString(),
    hours_ago: toHoursAgo(created),
    amount: Number(row.amount || 0),
    category: row.category || "other",
    merchant: row.recipientName || "unknown",
    beneficiary: row.recipientUPI || row.recipientName || "unknown",
    device: row.deviceId || "unknown",
    channel: row.type || "UPI",
    status: row.status || "completed"
  };
}

async function buildAccountContext(userId) {
  const [user, transactions] = await Promise.all([
    User.findById(userId).select("isSupervised spendingLimit role").lean(),
    Transaction.find({ userId }).sort({ createdAt: -1 }).lean()
  ]);

  return {
    account_id: String(userId),
    supervised: Boolean(user?.isSupervised),
    spending_limit: user?.spendingLimit ?? null,
    transactions: transactions.map(normalizeTransaction)
  };
}

async function callAI(path, payload) {
  const response = await axios.post(`${AI_URL}${path}`, payload, {
    timeout: Number(process.env.FRAUDSHIELD_AI_TIMEOUT_MS || 15000),
    headers: { "Content-Type": "application/json" }
  });
  return response.data;
}

async function analyzeAccount(userId) {
  const account = await buildAccountContext(userId);
  return callAI("/api/v1/risk/account", account);
}

async function analyzePaymentInitial(userId, payment) {
  const account = await buildAccountContext(userId);
  return callAI("/api/v1/risk/payment-initial", {
    account,
    amount: Number(payment.amount),
    category: payment.category || "other",
    beneficiary_id: payment.beneficiary_id || payment.recipientUPI || payment.recipientName || null,
    device_id: payment.device_id || payment.deviceId || null,
    channel: payment.channel || payment.type || "UPI"
  });
}

async function analyzePayment(userId, payment, initialAnalysis = null) {
  const account = await buildAccountContext(userId);
  const beneficiaryId = payment.beneficiary_id || payment.recipientUPI || payment.recipientName || null;
  const deviceId = payment.device_id || payment.deviceId || null;

  return callAI("/api/v1/risk/payment-pipeline", {
    account,
    amount: Number(payment.amount),
    category: payment.category || "other",
    beneficiary_id: beneficiaryId,
    device_id: deviceId,
    channel: payment.channel || payment.type || "UPI",
    call_transcript: payment.call_transcript || "",
    call_language: payment.call_language || "en-IN",
    call_active: Boolean(payment.call_active),
    initial_analysis: initialAnalysis || null
  });
}

async function analyzeVoice(transcript, language = "en-IN") {
  return callAI("/api/v1/risk/voice", { transcript, language });
}

async function analyzeMessage(text) {
  return callAI("/api/v1/risk/message", { text });
}

async function health() {
  const response = await axios.get(`${AI_URL}/api/health`, { timeout: 5000 });
  return response.data;
}

module.exports = {
  buildAccountContext,
  analyzeAccount,
  analyzePaymentInitial,
  analyzePayment,
  analyzeVoice,
  analyzeMessage,
  health
};