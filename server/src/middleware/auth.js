const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('./errorHandler');

// Verifies the Bearer JWT and attaches req.user = { id, role }
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Not logged in');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, role, is_active FROM users WHERE id = $1', [payload.id]);
    const user = rows[0];
    if (!user) throw new ApiError(401, 'Account no longer exists');
    if (!user.is_active) throw new ApiError(403, 'Account is deactivated');

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Attaches req.user if a valid token is present, but never blocks the request.
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, role, is_active FROM users WHERE id = $1', [payload.id]);
    if (rows[0] && rows[0].is_active) req.user = { id: rows[0].id, role: rows[0].role };
    next();
  } catch {
    next();
  }
}

module.exports = { requireAuth, optionalAuth };
