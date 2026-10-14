const pool = require('../config/db');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const list = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  res.json({ success: true, data: rows, message: '' });
});

const create = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
  if (existing.rows.length) throw new ApiError(400, 'A category with this name already exists');
  const { rows } = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json({ success: true, data: rows[0], message: 'Category added' });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { rows } = await pool.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
  if (!rows[0]) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: rows[0], message: 'Category renamed' });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT COUNT(*) FROM items WHERE category_id = $1', [id]);
  if (Number(rows[0].count) > 0) throw new ApiError(409, 'Cannot delete a category that is in use by items');
  const del = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!del.rows[0]) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: null, message: 'Category deleted' });
});

module.exports = { list, create, update, remove };
