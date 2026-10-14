const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoriesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validate } = require('../middleware/validate');

router.get('/', ctrl.list);
router.post('/', requireAuth, requireRole('admin'), validate({ name: { required: true, min: 2 } }), ctrl.create);
router.put('/:id', requireAuth, requireRole('admin'), validate({ name: { required: true, min: 2 } }), ctrl.update);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
