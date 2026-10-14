const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', ctrl.stats);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.setUserStatus);
router.get('/items', ctrl.listItems);

module.exports = router;
