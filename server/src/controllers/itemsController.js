const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// ---- helpers for pricing + gallery ----
function cleanChargeDays(input) {
  if (input === undefined || input === null) return null; // "not provided"
  const arr = Array.isArray(input) ? input : [];
  const days = [...new Set(arr.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
  return days;
}

function cleanPrice(input) {
  if (input === undefined || input === null || input === '') return null;
  const n = Number(input);
  if (Number.isNaN(n) || n < 0) throw new ApiError(400, 'price must be a number that is 0 or more');
  return Math.round(n * 100) / 100;
}

function cleanGallery(input) {
  if (input === undefined || input === null) return null; // "not provided" -> leave untouched
  if (!Array.isArray(input)) throw new ApiError(400, 'gallery must be a list of image URLs');
  return input.filter((u) => typeof u === 'string' && u.trim()).slice(0, 10);
}

async function saveGallery(client, itemId, urls) {
  await client.query('DELETE FROM item_images WHERE item_id = $1', [itemId]);
  for (let i = 0; i < urls.length; i++) {
    await client.query('INSERT INTO item_images (item_id, url, position) VALUES ($1, $2, $3)', [itemId, urls[i], i]);
  }
}

// GET /api/items?search=&category=&from=&to=&page=&condition=&sort=
const list = asyncHandler(async (req, res) => {
  const { search, category, from, to, condition, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = 6;
  const offset = (page - 1) * pageSize;

  const where = ['i.is_active = true', 'u.is_active = true'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`i.category_id = $${params.length}`);
  }
  if (condition) {
    params.push(condition);
    where.push(`i.condition = $${params.length}`);
  }
  if (from && to) {
    params.push(from, to);
    const p1 = params.length - 1;
    const p2 = params.length;
    where.push(`NOT EXISTS (
      SELECT 1 FROM bookings b WHERE b.item_id = i.id AND b.status IN ('APPROVED','PICKED_UP')
      AND b.start_date <= $${p2} AND b.end_date >= $${p1}
    )`);
  }

  const orderBy = sort === 'rating' ? 'avg_rating DESC NULLS LAST' : 'i.created_at DESC';

  const whereSql = where.join(' AND ');
  const dataSql = `
    SELECT i.*, c.name AS category_name, u.name AS owner_name,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.reviewee_id = u.id) AS avg_rating
    FROM items i
    JOIN categories c ON c.id = i.category_id
    JOIN users u ON u.id = i.owner_id
    WHERE ${whereSql}
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) FROM items i JOIN categories c ON c.id = i.category_id JOIN users u ON u.id = i.owner_id WHERE ${whereSql}`;

  const [dataRes, countRes] = await Promise.all([
    pool.query(dataSql, params),
    pool.query(countSql, params),
  ]);

  res.json({
    success: true,
    data: {
      items: dataRes.rows,
      total: Number(countRes.rows[0].count),
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(Number(countRes.rows[0].count) / pageSize)),
    },
    message: '',
  });
});

const mine = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS category_name FROM items i JOIN categories c ON c.id = i.category_id
     WHERE i.owner_id = $1 ORDER BY i.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows, message: '' });
});

const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS category_name, u.id AS owner_id, u.name AS owner_name, u.area AS owner_area,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.reviewee_id = u.id) AS owner_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = u.id) AS owner_review_count
     FROM items i JOIN categories c ON c.id = i.category_id JOIN users u ON u.id = i.owner_id
     WHERE i.id = $1`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'Item not found');
  const { rows: imgs } = await pool.query('SELECT url FROM item_images WHERE item_id = $1 ORDER BY position ASC, id ASC', [id]);
  res.json({ success: true, data: { ...rows[0], gallery: imgs.map((r) => r.url) }, message: '' });
});

const availability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT start_date, end_date, status FROM bookings
     WHERE item_id = $1 AND status IN ('REQUESTED', 'APPROVED', 'PICKED_UP')
     ORDER BY start_date ASC`,
    [id]
  );
  res.json({ success: true, data: rows, message: '' });
});

const create = asyncHandler(async (req, res) => {
  const { title, description, categoryId, condition, maxDays, pickupArea, imageUrl } = req.body;
  const price = cleanPrice(req.body.pricePerDay) ?? 0;
  const chargeDays = cleanChargeDays(req.body.chargeDays);
  const gallery = cleanGallery(req.body.gallery) || [];
  if (price > 0 && chargeDays && chargeDays.length === 0) throw new ApiError(400, 'Pick at least one day to charge for, or set the price to 0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO items (owner_id, category_id, title, description, condition, max_days, pickup_area, image_url, price_per_day, charge_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, categoryId, title, description || null, condition, maxDays, pickupArea || null, imageUrl || null,
        price, chargeDays && chargeDays.length ? chargeDays : [0, 1, 2, 3, 4, 5, 6]]
    );
    await saveGallery(client, rows[0].id, gallery);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...rows[0], gallery }, message: 'Item listed' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

async function assertOwner(itemId, userId, allowAdmin, role) {
  const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
  const item = rows[0];
  if (!item) throw new ApiError(404, 'Item not found');
  if (item.owner_id !== userId && !(allowAdmin && role === 'admin')) {
    throw new ApiError(403, 'Only the owner can do this');
  }
  return item;
}

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await assertOwner(id, req.user.id, true, req.user.role);
  const { title, description, categoryId, condition, maxDays, pickupArea, imageUrl, isActive } = req.body;
  const price = cleanPrice(req.body.pricePerDay);
  const chargeDays = cleanChargeDays(req.body.chargeDays);
  const gallery = cleanGallery(req.body.gallery);
  if (price !== null && price > 0 && chargeDays && chargeDays.length === 0) {
    throw new ApiError(400, 'Pick at least one day to charge for, or set the price to 0');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // imageUrl may be '' (owner removed the main photo) -> store NULL. undefined -> keep as is.
    const { rows } = await client.query(
      `UPDATE items SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category_id = COALESCE($3, category_id),
         condition = COALESCE($4, condition),
         max_days = COALESCE($5, max_days),
         pickup_area = COALESCE($6, pickup_area),
         image_url = CASE WHEN $7::text IS NULL THEN image_url WHEN $7::text = '' THEN NULL ELSE $7::text END,
         is_active = COALESCE($8, is_active),
         price_per_day = COALESCE($9, price_per_day),
         charge_days = CASE WHEN $10::int[] IS NULL OR cardinality($10::int[]) = 0 THEN charge_days ELSE $10::int[] END
       WHERE id = $11 RETURNING *`,
      [title, description, categoryId, condition, maxDays, pickupArea, imageUrl, isActive, price, chargeDays, id]
    );
    if (gallery) await saveGallery(client, id, gallery);
    await client.query('COMMIT');
    res.json({ success: true, data: rows[0], message: 'Item updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await assertOwner(id, req.user.id, true, req.user.role);
  const { rows } = await pool.query('SELECT COUNT(*) FROM bookings WHERE item_id = $1', [id]);
  if (Number(rows[0].count) > 0) {
    await pool.query('UPDATE items SET is_active = false WHERE id = $1', [id]);
    return res.json({ success: true, data: null, message: 'Item has booking history, so it was deactivated instead of deleted' });
  }
  await pool.query('DELETE FROM items WHERE id = $1', [id]);
  res.json({ success: true, data: null, message: 'Item deleted' });
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file received');
  // Publicly reachable path served by express.static in server.js
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url }, message: 'Image uploaded' });
});

module.exports = { list, mine, getOne, availability, create, update, remove, uploadImage };
