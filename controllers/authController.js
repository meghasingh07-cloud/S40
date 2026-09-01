const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/localDb');

const JWT_SECRET = process.env.JWT_SECRET || 'fraudshield-local-dev-secret-change-me';
const JWT_ISSUER = process.env.JWT_ISSUER || 'fraudshield';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'fraudshield-web';

function signUser(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, isSupervised: user.isSupervised, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h', issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithm: 'HS256' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role, isSupervised, parentId, spendingLimit } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be 8-128 characters' });
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ message: 'Enter a valid name' });
    if (db.findUser(normalizedEmail)) return res.status(409).json({ message: 'User already exists. Sign in instead.' });

    const user = db.createUser({
      name, email: normalizedEmail, password: await bcrypt.hash(password, 12),
      role: role || 'user', isSupervised: Boolean(isSupervised), parentId: parentId || null,
      spendingLimit: spendingLimit || 5000
    });
    if (!user) return res.status(409).json({ message: 'User already exists. Sign in instead.' });
    return res.status(201).json({ message: 'User registered successfully', user: db.publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== 'string' || password.length > 128) return res.status(400).json({ message: 'Invalid email or password' });
    const user = db.findUser(normalizedEmail);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    const token = signUser(user);
    return res.json({ message: 'Login successful', token, user: db.publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

function me(req, res) {
  const user = db.findUserById(req.user.userId);
  if (!user) return res.status(401).json({ message: 'Session user no longer exists' });
  return res.json({ user: db.publicUser(user) });
}

module.exports = { register, login, me };
