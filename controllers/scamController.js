const db = require('../services/localDb');
const calculateRiskLevel = score => score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

function createSession(req, res) {
  const session = db.createScamSession(req.user.userId);
  res.status(201).json({ message: 'Scam session created', session });
}

function addEvent(req, res) {
  const session = db.findScamSession(req.params.sessionId, req.user.userId);
  if (!session) return res.status(404).json({ message: 'Scam session not found' });
  if (session.status !== 'active') return res.status(400).json({ message: 'Scam session is no longer active' });
  const { type, riskContribution, explanation, metadata } = req.body || {};
  if (typeof riskContribution !== 'number') return res.status(400).json({ message: 'riskContribution must be a number' });
  const oldScore = session.currentRiskScore;
  const newScore = Math.min(oldScore + riskContribution, 100);
  const eventOrder = session.totalEvents + 1;
  const event = db.addRiskEvent({ userId: req.user.userId, sessionId: session.id, eventOrder, type, riskContribution, explanation, metadata: metadata || {} });
  db.updateScamSession(session.id, req.user.userId, { currentRiskScore: newScore, riskLevel: calculateRiskLevel(newScore), totalEvents: eventOrder });
  res.status(201).json({ message: 'Risk event added successfully', event, riskEvolution: { previousScore: oldScore, currentScore: newScore, riskLevel: calculateRiskLevel(newScore) } });
}

function getTimeline(req, res) {
  const session = db.findScamSession(req.params.sessionId, req.user.userId);
  if (!session) return res.status(404).json({ message: 'Scam session not found' });
  res.json({ session, events: db.listRiskEvents(req.params.sessionId, req.user.userId) });
}
module.exports = { createSession, addEvent, getTimeline };
