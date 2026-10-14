const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// Allowed status transitions (Section 06 of the brief)
const TRANSITIONS = {
  approve: { from: ['REQUESTED'], to: 'APPROVED', actor: 'owner' },
  reject: { from: ['REQUESTED'], to: 'REJECTED', actor: 'owner' },
  cancel: { from: ['REQUESTED', 'APPROVED'], to: 'CANCELLED', actor: 'borrower' },
  pickup: { from: ['APPROVED'], to: 'PICKED_UP', actor: 'owner' },
  return: { from: ['PICKED_UP'], to: 'RETURNED', actor: 'owner' },
};

// Normalises a DATE (string or JS Date from pg) to 'YYYY-MM-DD'.
function toISODate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Price = number of selected days that fall on a weekday the owner charges for,
// multiplied by the owner's daily rate. chargeDays uses 0=Sun ... 6=Sat.
function computePrice(startDate, endDate, pricePerDay, chargeDays) {
  const rate = Number(pricePerDay) || 0;
  const allowed = new Set((chargeDays && chargeDays.length ? chargeDays : [0, 1, 2, 3, 4, 5, 6]).map(Number));
  const start = new Date(`${toISODate(startDate)}T00:00:00Z`);
  const end = new Date(`${toISODate(endDate)}T00:00:00Z`);
  let chargeable = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (allowed.has(d.getUTCDay())) chargeable += 1;
  }
  return { chargeableDays: chargeable, totalPrice: Math.round(chargeable * rate * 100) / 100 };
}

// The heart of the project: are the requested dates free for this item?
// A row returned = dates overlap = reject with 409 Conflict.
async function hasOverlap(client, itemId, startDate, endDate, excludeBookingId = null) {
  const params = [itemId, startDate, endDate];
  let sql = `
    SELECT 1 FROM bookings
    WHERE item_id = $1
      AND status IN ('APPROVED', 'PICKED_UP')
      AND start_date <= $3
      AND end_date >= $2
  `;
  if (excludeBookingId) {
    params.push(excludeBookingId);
    sql += ` AND id != $4`;
  }
  const { rows } = await client.query(sql, params);
  return rows.length > 0;
}

// Rule 1-6: validates a new booking request before insert.
async function validateNewBooking(client, { itemId, borrowerId, startDate, endDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(startDate) < today) throw new ApiError(400, 'Start date cannot be in the past');
  if (new Date(endDate) < new Date(startDate)) throw new ApiError(400, 'End date must be on or after start date');

  const { rows: itemRows } = await client.query(
    `SELECT i.*, u.is_active AS owner_active
     FROM items i JOIN users u ON u.id = i.owner_id
     WHERE i.id = $1`,
    [itemId]
  );
  const item = itemRows[0];
  if (!item) throw new ApiError(404, 'Item not found');
  if (!item.is_active || !item.owner_active) throw new ApiError(400, 'This item is not available to borrow');
  if (item.owner_id === borrowerId) throw new ApiError(400, 'You cannot borrow your own item');

  const days = Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
  if (days > item.max_days) throw new ApiError(400, `Borrow duration cannot exceed ${item.max_days} days for this item`);

  const { rows: openRows } = await client.query(
    `SELECT COUNT(*) FROM bookings
     WHERE borrower_id = $1 AND status IN ('REQUESTED', 'APPROVED', 'PICKED_UP')`,
    [borrowerId]
  );
  if (Number(openRows[0].count) >= 3) throw new ApiError(400, 'You already have 3 open bookings. Finish or cancel one first.');

  if (await hasOverlap(client, itemId, startDate, endDate)) {
    throw new ApiError(409, 'This item is already booked for part of the selected dates');
  }

  return item;
}

async function createBooking({ itemId, borrowerId, startDate, endDate, message }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = await validateNewBooking(client, { itemId, borrowerId, startDate, endDate });
    const { chargeableDays, totalPrice } = computePrice(startDate, endDate, item.price_per_day, item.charge_days);
    const { rows } = await client.query(
      `INSERT INTO bookings (item_id, borrower_id, start_date, end_date, message, chargeable_days, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [itemId, borrowerId, startDate, endDate, message || null, chargeableDays, totalPrice]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Rule 7 & 8 & 9: role-based transition with auto-reject of clashing requests.
async function changeStatus({ bookingId, action, userId, note, rejectReason }) {
  const transition = TRANSITIONS[action];
  if (!transition) throw new ApiError(400, 'Unknown action');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bRows } = await client.query(
      `SELECT b.*, i.owner_id, i.id AS item_pk
       FROM bookings b JOIN items i ON i.id = b.item_id
       WHERE b.id = $1 FOR UPDATE OF b`,
      [bookingId]
    );
    const booking = bRows[0];
    if (!booking) throw new ApiError(404, 'Booking not found');

    const isOwner = booking.owner_id === userId;
    const isBorrower = booking.borrower_id === userId;
    if (transition.actor === 'owner' && !isOwner) throw new ApiError(403, 'Only the item owner can do this');
    if (transition.actor === 'borrower' && !isBorrower) throw new ApiError(403, 'Only the borrower can do this');

    if (!transition.from.includes(booking.status)) {
      throw new ApiError(409, `Cannot ${action} a booking that is ${booking.status}`);
    }

    // lock the item row for approve, to safely re-check overlap + auto-reject
    if (action === 'approve') {
      await client.query('SELECT id FROM items WHERE id = $1 FOR UPDATE', [booking.item_id]);
      if (await hasOverlap(client, booking.item_id, booking.start_date, booking.end_date, booking.id)) {
        throw new ApiError(409, 'Dates were just booked by someone else. Please reject or ask the borrower to change dates.');
      }
    }

    const { rows: updated } = await client.query(
      `UPDATE bookings SET status = $1::varchar, updated_at = NOW(),
              reject_reason = CASE WHEN $1::varchar = 'REJECTED' THEN $2 ELSE reject_reason END
       WHERE id = $3 RETURNING *`,
      [transition.to, rejectReason || null, bookingId]
    );

    if (action === 'approve') {
      await client.query(
        `UPDATE bookings SET status = 'REJECTED', reject_reason = 'Auto-rejected: dates no longer available', updated_at = NOW()
         WHERE item_id = $1 AND status = 'REQUESTED' AND id != $2
           AND start_date <= $4 AND end_date >= $3`,
        [booking.item_id, booking.id, booking.start_date, booking.end_date]
      );
    }

    if (action === 'pickup' || action === 'return') {
      const condition = note && note.condition ? note.condition : 'good';
      const text = note && note.text ? note.text : null;
      await client.query(
        `INSERT INTO condition_logs (booking_id, stage, condition, note, logged_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (booking_id, stage) DO UPDATE SET condition = EXCLUDED.condition, note = EXCLUDED.note`,
        [bookingId, action === 'pickup' ? 'handover' : 'return', condition, text, userId]
      );
    }

    await client.query('COMMIT');
    return updated[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { computePrice, toISODate, hasOverlap, validateNewBooking, createBooking, changeStatus, TRANSITIONS };
