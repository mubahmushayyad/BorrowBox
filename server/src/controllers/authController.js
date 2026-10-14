const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, area: u.area, role: u.role, createdAt: u.created_at };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, area } = req.body;
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) throw new ApiError(400, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, area) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email.toLowerCase(), hash, phone || null, area || null]
  );
  const user = rows[0];
  res.status(201).json({ success: true, data: { user: publicUser(user), token: signToken(user) }, message: 'Account created' });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.is_active) throw new ApiError(403, 'This account has been deactivated');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  res.json({ success: true, data: { user: publicUser(user), token: signToken(user) }, message: 'Logged in' });
});

const me = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: publicUser(rows[0]), message: '' });
});

module.exports = { register, login, me };
