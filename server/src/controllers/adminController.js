const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const stats = asyncHandler(async (req, res) => {
  const [users, items, bookingsByStatus] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM items'),
    pool.query('SELECT status, COUNT(*) FROM bookings GROUP BY status'),
  ]);
  const statusMap = { REQUESTED: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, PICKED_UP: 0, RETURNED: 0 };
  bookingsByStatus.rows.forEach((r) => { statusMap[r.status] = Number(r.count); });

  res.json({
    success: true,
    data: {
      totalUsers: Number(users.rows[0].count),
      totalItems: Number(items.rows[0].count),
      bookingsByStatus: statusMap,
      totalBookings: Object.values(statusMap).reduce((a, b) => a + b, 0),
    },
    message: '',
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, phone, area, role, is_active, created_at FROM users ORDER BY created_at DESC`
  );
  res.json({ success: true, data: rows, message: '' });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (Number(id) === req.user.id) throw new ApiError(400, 'You cannot deactivate your own admin account');
  const { rows } = await pool.query(
    'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
    [isActive, id]
  );
  if (!rows[0]) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: rows[0], message: isActive ? 'User activated' : 'User deactivated' });
});

const listItems = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS category_name, u.name AS owner_name
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.owner_id
     ORDER BY i.created_at DESC`
  );
  res.json({ success: true, data: rows, message: '' });
});

module.exports = { stats, listUsers, setUserStatus, listItems };
