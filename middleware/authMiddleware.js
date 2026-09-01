const jwt = require('jsonwebtoken');
const db = require('../services/localDb');
const JWT_SECRET = process.env.JWT_SECRET || 'fraudshield-local-dev-secret-change-me';
const options = {
  algorithms: ['HS256'],
  issuer: process.env.JWT_ISSUER || 'fraudshield',
  audience: process.env.JWT_AUDIENCE || 'fraudshield-web'
};
module.exports = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
    const token = header.slice(7).trim();
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, JWT_SECRET, options);
    if (!db.findUserById(payload.userId)) return res.status(401).json({ message: 'Session is no longer valid' });
    req.user = payload;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Invalid authentication token. Please sign in again.';
    return res.status(401).json({ message });
  }
};
