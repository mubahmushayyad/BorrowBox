const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// POST /api/bookings/:id/reviews
const create = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params;
  const { rating, comment } = req.body;

  const { rows } = await pool.query(
    `SELECT b.*, i.owner_id FROM bookings b JOIN items i ON i.id = b.item_id WHERE b.id = $1`,
    [bookingId]
  );
  const booking = rows[0];
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== 'RETURNED') throw new ApiError(409, 'Reviews open only after the item is returned');

  const isBorrower = booking.borrower_id === req.user.id;
  const isOwner = booking.owner_id === req.user.id;
  if (!isBorrower && !isOwner) throw new ApiError(403, 'Only participants of this booking can review');

  const revieweeId = isBorrower ? booking.owner_id : booking.borrower_id;

  const existing = await pool.query(
    'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
    [bookingId, req.user.id]
  );
  if (existing.rows.length) throw new ApiError(400, 'You already reviewed this booking');

  const { rows: created } = await pool.query(
    `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [bookingId, req.user.id, revieweeId, rating, comment || null]
  );
  res.status(201).json({ success: true, data: created[0], message: 'Review submitted' });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  const review = rows[0];
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') throw new ApiError(403, 'Only the author can edit this review');

  const { rows: updated } = await pool.query(
    'UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE id = $3 RETURNING *',
    [rating, comment, id]
  );
  res.json({ success: true, data: updated[0], message: 'Review updated' });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  const review = rows[0];
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') throw new ApiError(403, 'Only the author or an admin can delete this review');
  await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  res.json({ success: true, data: null, message: 'Review deleted' });
});

module.exports = { create, update, remove };
