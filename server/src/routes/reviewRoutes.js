const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');

router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
