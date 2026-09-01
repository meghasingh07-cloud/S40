const calculateRisk = require('../services/riskEngine');
const db = require('../services/localDb');

function createTransaction(req, res) {
  try {
    const { amount, type, recipientName, recipientUPI, category, isNewRecipient, deviceId, source, isNewDevice, sessionId, status } = req.body || {};
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'A valid amount is required' });
    if (!String(recipientName || '').trim()) return res.status(400).json({ message: 'Recipient is required' });

    const riskInput = {
      amount: numericAmount, category: category || 'other', isNewRecipient: Boolean(isNewRecipient),
      source: source || 'app', isNewDevice: Boolean(isNewDevice), isSupervised: Boolean(req.user.isSupervised)
    };
    const riskResult = calculateRisk(riskInput);
    const safeStatus = ['pending', 'completed', 'cancelled'].includes(String(status || '').toLowerCase())
      ? String(status).toLowerCase() : 'completed';

    const transaction = db.addTransaction({
      userId: req.user.userId, amount: numericAmount, type: type || 'UPI',
      recipientName: String(recipientName).trim(), recipientUPI: recipientUPI || null,
      category: category || 'other', isNewRecipient: Boolean(isNewRecipient),
      deviceId: deviceId || null, source: source || 'app', isNewDevice: Boolean(isNewDevice),
      sessionId: sessionId || null, status: safeStatus,
      riskScore: riskResult.score, riskLevel: riskResult.riskLevel
    });

    return res.status(201).json({
      message: `Transaction saved in local database (${safeStatus})`, demoMode: true,
      transaction: { id: transaction.id, amount: transaction.amount, recipientName: transaction.recipientName, status: transaction.status, riskScore: transaction.riskScore, riskLevel: transaction.riskLevel },
      riskAnalysis: { score: riskResult.score, level: riskResult.riskLevel, events: riskResult.events }
    });
  } catch (error) {
    console.error('[FraudShield] transaction error:', error);
    return res.status(500).json({ message: 'Transaction analysis failed', error: error.message });
  }
}

function listTransactions(req, res) {
  const rows = db.transactionsForUser(req.user.userId).map(t => ({
    id: t.id, amount: t.amount, type: t.type, recipientName: t.recipientName,
    recipientUPI: t.recipientUPI, category: t.category, status: t.status,
    riskScore: t.riskScore, riskLevel: t.riskLevel, createdAt: t.createdAt
  }));
  res.json({ transactions: rows, pending: rows.filter(x => x.status === 'pending') });
}

function updateTransactionStatus(req, res) {
  const allowed = ['pending', 'completed', 'cancelled'];
  const status = String(req.body?.status || '').toLowerCase();
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid transaction status' });
  const own = db.transactionsForUser(req.user.userId).find(t => String(t.id) === String(req.params.id));
  if (!own) return res.status(404).json({ message: 'Transaction not found' });
  const updated = db.updateTransaction(req.params.id, { status });
  return res.json({ transaction: updated });
}

module.exports = { createTransaction, listTransactions, updateTransactionStatus };
