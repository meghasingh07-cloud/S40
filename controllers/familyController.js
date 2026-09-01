const db = require('../services/localDb');

function requestApproval(req, res) {
  const { transactionId } = req.body || {};
  if (!transactionId) return res.status(400).json({ message: 'transactionId is required' });
  const child = db.findUserById(req.user.userId);
  const tx = db.transactionsForUser(req.user.userId).find(t => String(t.id) === String(transactionId));
  if (!child || !tx) return res.status(404).json({ message: 'User or transaction not found' });
  if (!child.isSupervised || !child.parentId) return res.status(400).json({ message: 'This account is not configured for parent approval' });
  const approval = db.addApproval({ childId: child.id, parentId: child.parentId, transactionId: tx.id, reason: `High-risk transaction (${tx.riskLevel})` });
  res.status(201).json({ message: 'Parent approval requested', approval });
}

function getPendingApprovals(req, res) {
  const approvals = db.getApprovalsForParent(req.user.userId).map(a => ({ ...a, transaction: db.transactionsForUser(a.childId).find(t => String(t.id) === String(a.transactionId)) || null, child: db.findUserById(a.childId) ? db.publicUser(db.findUserById(a.childId)) : null }));
  res.json({ approvals });
}

function respondToApproval(req, res) {
  const { action } = req.body || {};
  if (!['APPROVED', 'REJECTED'].includes(action)) return res.status(400).json({ message: 'Action must be APPROVED or REJECTED' });
  const approval = db.getApprovalsForParent(req.user.userId).find(a => String(a.id) === String(req.params.approvalId));
  if (!approval) return res.status(404).json({ message: 'Pending approval not found' });
  const updated = db.updateApproval(approval.id, { status: action, reviewedAt: new Date().toISOString() });
  db.updateTransaction(approval.transactionId, { status: action === 'APPROVED' ? 'completed' : 'cancelled' });
  res.json({ message: action === 'APPROVED' ? 'Transaction approved successfully' : 'Transaction rejected successfully', approval: { id: updated.id, status: updated.status, reviewedAt: updated.reviewedAt } });
}
module.exports = { requestApproval, getPendingApprovals, respondToApproval };
