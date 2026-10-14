const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, area } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), area = COALESCE($3, area)
     WHERE id = $4 RETURNING id, name, email, phone, area, role, created_at`,
    [name, phone, area, req.user.id]
  );
  res.json({ success: true, data: rows[0], message: 'Profile updated' });
});

const deleteMe = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM bookings
     WHERE (borrower_id = $1 AND status IN ('REQUESTED','APPROVED','PICKED_UP'))
        OR (item_id IN (SELECT id FROM items WHERE owner_id = $1) AND status IN ('REQUESTED','APPROVED','PICKED_UP'))`,
    [req.user.id]
  );
  if (Number(rows[0].count) > 0) throw new ApiError(409, 'Cannot delete account while you have open bookings');

  await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.user.id]);
  res.json({ success: true, data: null, message: 'Account deactivated' });
});

// Public profile: user info + trust score (avg rating) + reviews received
const getPublicProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT id, name, area, role, created_at FROM users WHERE id = $1 AND is_active = true',
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'User not found');

  const { rows: statRows } = await pool.query(
    'SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE reviewee_id = $1',
    [id]
  );
  const { rows: reviewRows } = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
     FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...rows[0],
      trustScore: Number(statRows[0].avg_rating).toFixed(1),
      reviewCount: Number(statRows[0].review_count),
      reviews: reviewRows,
    },
    message: '',
  });
});

module.exports = { updateMe, deleteMe, getPublicProfile };
