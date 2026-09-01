const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const DB_DIR = path.join(__dirname, '..', '.fraudshield-data');
const DB_FILE = path.join(DB_DIR, 'database.json');
const DEMO_EMAIL = 'demo@fraudshield.local';
const DEMO_PASSWORD = 'Demo@12345';
const DEMO_USER_ID = 'local-demo-user-0001';

function ensureDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      users: [{
        id: DEMO_USER_ID,
        name: 'Demo User',
        email: DEMO_EMAIL,
        password: bcrypt.hashSync(DEMO_PASSWORD, 10),
        role: 'user',
        isSupervised: false,
        parentId: null,
        spendingLimit: 5000,
        createdAt: new Date().toISOString()
      }],
      transactions: [
        { id: randomUUID(), userId: DEMO_USER_ID, amount: 420, type: 'UPI', recipientName: 'Fresh Mart', category: 'shopping', deviceId: 'demo-device', source: 'app', status: 'completed', riskScore: 8, riskLevel: 'LOW', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: randomUUID(), userId: DEMO_USER_ID, amount: 280, type: 'UPI', recipientName: 'Cafe Coffee', category: 'food', deviceId: 'demo-device', source: 'app', status: 'completed', riskScore: 6, riskLevel: 'LOW', createdAt: new Date(Date.now() - 36 * 3600000).toISOString() },
        { id: randomUUID(), userId: DEMO_USER_ID, amount: 950, type: 'UPI', recipientName: 'Metro Travel', category: 'travel', deviceId: 'demo-device', source: 'app', status: 'completed', riskScore: 10, riskLevel: 'LOW', createdAt: new Date(Date.now() - 18 * 3600000).toISOString() },
        { id: randomUUID(), userId: DEMO_USER_ID, amount: 700, type: 'UPI', recipientName: 'Book Store', category: 'education', deviceId: 'demo-device', source: 'app', status: 'completed', riskScore: 9, riskLevel: 'LOW', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: randomUUID(), userId: DEMO_USER_ID, amount: 1250, type: 'UPI', recipientName: 'Fresh Mart', category: 'shopping', deviceId: 'demo-device', source: 'app', status: 'completed', riskScore: 12, riskLevel: 'LOW', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() }
      ],
      approvals: [],
      scamSessions: [],
      riskEvents: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], transactions: [], approvals: [], scamSessions: [], riskEvents: [] }; }
}

function writeDb(db) {
  ensureDb();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function findUser(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return readDb().users.find(u => u.email === normalized) || null;
}

function findUserById(id) {
  return readDb().users.find(u => String(u.id) === String(id)) || null;
}

function createUser({ name, email, password, role = 'user', isSupervised = false, parentId = null, spendingLimit = 5000 }) {
  const db = readDb();
  const normalized = String(email).trim().toLowerCase();
  if (db.users.some(u => u.email === normalized)) return null;
  const user = {
    id: randomUUID(), name: String(name).trim(), email: normalized, password,
    role, isSupervised: Boolean(isSupervised), parentId: parentId || null,
    spendingLimit: Number(spendingLimit) || 5000, createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

function addTransaction(input) {
  const db = readDb();
  const tx = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input
  };
  db.transactions.unshift(tx);
  writeDb(db);
  return tx;
}

function updateTransaction(id, patch) {
  const db = readDb();
  const tx = db.transactions.find(x => String(x.id) === String(id));
  if (!tx) return null;
  Object.assign(tx, patch, { updatedAt: new Date().toISOString() });
  writeDb(db);
  return tx;
}

function transactionsForUser(userId) {
  return readDb().transactions.filter(x => String(x.userId) === String(userId));
}

function addApproval(input) {
  const db = readDb();
  const approval = { id: randomUUID(), status: 'PENDING', createdAt: new Date().toISOString(), ...input };
  db.approvals.unshift(approval);
  writeDb(db);
  return approval;
}

function getApprovalsForParent(parentId) {
  return readDb().approvals.filter(a => String(a.parentId) === String(parentId) && a.status === 'PENDING');
}

function updateApproval(id, patch) {
  const db = readDb();
  const approval = db.approvals.find(x => String(x.id) === String(id));
  if (!approval) return null;
  Object.assign(approval, patch, { updatedAt: new Date().toISOString() });
  writeDb(db);
  return approval;
}

function createScamSession(userId) {
  const db = readDb();
  const session = { id: randomUUID(), userId, status: 'active', currentRiskScore: 0, riskLevel: 'LOW', totalEvents: 0, createdAt: new Date().toISOString() };
  db.scamSessions.unshift(session); writeDb(db); return session;
}

function findScamSession(id, userId) {
  return readDb().scamSessions.find(s => String(s.id) === String(id) && String(s.userId) === String(userId)) || null;
}

function addRiskEvent(input) {
  const db = readDb();
  const event = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  db.riskEvents.push(event); writeDb(db); return event;
}

function listRiskEvents(sessionId, userId) {
  return readDb().riskEvents.filter(e => String(e.sessionId) === String(sessionId) && String(e.userId) === String(userId)).sort((a,b) => a.eventOrder - b.eventOrder);
}

function updateScamSession(id, userId, patch) {
  const db = readDb();
  const session = db.scamSessions.find(s => String(s.id) === String(id) && String(s.userId) === String(userId));
  if (!session) return null;
  Object.assign(session, patch); writeDb(db); return session;
}

module.exports = {
  DB_FILE, DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER_ID,
  ensureDb, readDb, publicUser, findUser, findUserById, createUser,
  addTransaction, updateTransaction, transactionsForUser,
  addApproval, getApprovalsForParent, updateApproval,
  createScamSession, findScamSession, addRiskEvent, listRiskEvents, updateScamSession
};
