const axios = require('axios');
const demoStore = require('./demoStore');
const AI_URL = process.env.FRAUDSHIELD_AI_URL || 'http://127.0.0.1:8000';
const INTERNAL_SECRET = process.env.FRAUDSHIELD_INTERNAL_SECRET || 'fraudshield-local-internal-dev';
const TIMEOUT = Number(process.env.FRAUDSHIELD_AI_TIMEOUT_MS || 30000);

function toHoursAgo(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / 3600000);
}
function normalizeTransaction(row) {
  const created = row.createdAt || row.updatedAt || new Date();
  return { id: String(row.id || row._id || ''), timestamp: new Date(created).toISOString(), hours_ago: toHoursAgo(created), amount: Number(row.amount || 0), category: row.category || 'other', merchant: row.recipientName || 'unknown', beneficiary: row.recipientUPI || row.recipientName || 'unknown', device: row.deviceId || 'unknown', channel: row.type || 'UPI', status: row.status || 'completed' };
}
async function buildAccountContext(userId) {
  const transactions = demoStore.transactionsForUser(userId);
  const user = demoStore.findUserById(userId);
  return { account_id: String(userId), supervised: Boolean(user?.isSupervised), spending_limit: user?.spendingLimit ?? null, transactions: transactions.map(normalizeTransaction) };
}
async function callAI(path, payload, extra = {}) {
  const response = await axios.post(`${AI_URL}${path}`, payload, { timeout: TIMEOUT, headers: { 'Content-Type': 'application/json', ...(INTERNAL_SECRET ? { 'x-fraudshield-secret': INTERNAL_SECRET } : {}), ...extra } });
  return response.data;
}
async function analyzeAccount(userId) { return callAI('/api/v1/risk/account', await buildAccountContext(userId)); }
async function analyzePaymentInitial(userId, payment) { return callAI('/api/v1/risk/payment-initial', { account: await buildAccountContext(userId), amount: Number(payment.amount), category: payment.category || 'other', beneficiary_id: payment.beneficiary_id || payment.recipientUPI || payment.recipientName || null, device_id: payment.device_id || payment.deviceId || null, channel: payment.channel || payment.type || 'UPI' }); }
async function analyzePayment(userId, payment, initialAnalysis = null) { return callAI('/api/v1/risk/payment-pipeline', { account: await buildAccountContext(userId), amount: Number(payment.amount), category: payment.category || 'other', beneficiary_id: payment.beneficiary_id || payment.recipientUPI || payment.recipientName || null, device_id: payment.device_id || payment.deviceId || null, channel: payment.channel || payment.type || 'UPI', call_transcript: payment.call_transcript || '', call_language: payment.call_language || 'en-IN', call_active: Boolean(payment.call_active), external_context: Array.isArray(payment.external_context) ? payment.external_context : [], initial_analysis: initialAnalysis }); }
async function analyzeVoice(transcript, language = 'en-IN') { return callAI('/api/v1/risk/voice', { transcript, language }); }
async function analyzeMessage(text) { return callAI('/api/v1/risk/message', { text }); }
async function analyzeText(text) { return callAI('/api/v1/risk/text-analysis', { text }); }
async function intelligenceSearch(query, kind = 'auto') { return callAI('/api/v1/intelligence/search', { query, kind }); }
async function transcribeAudio(buffer, filename = 'call.webm', mimeType = 'audio/webm') { const r = await axios.post(`${AI_URL}/api/v1/call/transcribe`, buffer, { timeout: 45000, headers: { 'Content-Type': mimeType, 'x-filename': filename, ...(INTERNAL_SECRET ? { 'x-fraudshield-secret': INTERNAL_SECRET } : {}) } }); return r.data; }
async function intelligenceStats() { const r = await axios.get(`${AI_URL}/api/v1/intelligence/stats`, { timeout: 5000, headers: INTERNAL_SECRET ? { 'x-fraudshield-secret': INTERNAL_SECRET } : {} }); return r.data; }
async function health() { const r = await axios.get(`${AI_URL}/api/health`, { timeout: 5000 }); return r.data; }
module.exports = { buildAccountContext, analyzeAccount, analyzePaymentInitial, analyzePayment, analyzeVoice, analyzeMessage, analyzeText, intelligenceSearch, intelligenceStats, transcribeAudio, health };
