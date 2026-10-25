const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sutra-urban-taskforce-secret-key-2026-jaipur';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token.' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrative privileges required for this action.' });
  }
  next();
}

function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (_err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  });
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin,
  optionalToken,
};
