const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const bookingService = require('../services/bookingService');

const create = asyncHandler(async (req, res) => {
  const { itemId, startDate, endDate, message } = req.body;
  const booking = await bookingService.createBooking({
    itemId, borrowerId: req.user.id, startDate, endDate, message,
  });
  res.status(201).json({ success: true, data: booking, message: 'Request sent to the owner' });
});

const BOOKING_SELECT = `
  SELECT b.*, i.title AS item_title, i.image_url AS item_image, i.owner_id, i.price_per_day,
    bu.name AS borrower_name, ou.name AS owner_name,
    (b.status = 'PICKED_UP' AND b.end_date < CURRENT_DATE) AS is_overdue
  FROM bookings b
  JOIN items i ON i.id = b.item_id
  JOIN users bu ON bu.id = b.borrower_id
  JOIN users ou ON ou.id = i.owner_id
`;

const mine = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `${BOOKING_SELECT} WHERE b.borrower_id = $1 ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows, message: '' });
});

const incoming = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `${BOOKING_SELECT} WHERE i.owner_id = $1 ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows, message: '' });
});

const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
  const booking = rows[0];
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.borrower_id !== req.user.id && booking.owner_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed to view this booking');
  }
  const { rows: logs } = await pool.query(
    'SELECT * FROM condition_logs WHERE booking_id = $1 ORDER BY logged_at ASC',
    [id]
  );
  const { rows: reviews } = await pool.query(
    `SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE booking_id = $1`,
    [id]
  );
  res.json({ success: true, data: { ...booking, conditionLogs: logs, reviews }, message: '' });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  const booking = rows[0];
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.borrower_id !== req.user.id) throw new ApiError(403, 'Only the borrower can edit this booking');
  if (booking.status !== 'REQUESTED') throw new ApiError(409, 'Can only edit a booking while it is REQUESTED');

  const { startDate, endDate, message } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newStart = startDate || bookingService.toISODate(booking.start_date);
    const newEnd = endDate || bookingService.toISODate(booking.end_date);
    const item = await bookingService.validateNewBooking(client, {
      itemId: booking.item_id,
      borrowerId: req.user.id,
      startDate: newStart,
      endDate: newEnd,
    });
    const { chargeableDays, totalPrice } = bookingService.computePrice(newStart, newEnd, item.price_per_day, item.charge_days);
    const { rows: updated } = await client.query(
      `UPDATE bookings SET start_date = COALESCE($1, start_date), end_date = COALESCE($2, end_date),
       message = COALESCE($3, message), chargeable_days = $5, total_price = $6, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [startDate, endDate, message, id, chargeableDays, totalPrice]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: updated[0], message: 'Booking updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  const booking = rows[0];
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.borrower_id !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not allowed to remove this booking');
  }
  if (!['REJECTED', 'CANCELLED'].includes(booking.status)) {
    throw new ApiError(409, 'Only a REJECTED or CANCELLED booking can be removed');
  }
  await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
  res.json({ success: true, data: null, message: 'Booking removed' });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, note, rejectReason } = req.body;
  const booking = await bookingService.changeStatus({
    bookingId: id, action, userId: req.user.id, note, rejectReason,
  });
  res.json({ success: true, data: booking, message: `Booking ${action}d` });
});

module.exports = { create, mine, incoming, getOne, update, remove, changeStatus };
