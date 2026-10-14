const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');

router.put('/me', requireAuth, ctrl.updateMe);
router.delete('/me', requireAuth, ctrl.deleteMe);
router.get('/:id', ctrl.getPublicProfile);

module.exports = router;
