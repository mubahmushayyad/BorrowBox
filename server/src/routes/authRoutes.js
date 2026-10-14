const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

router.post('/register', validate({
  name: { required: true, min: 2 },
  email: { required: true, type: 'email' },
  password: { required: true, min: 6 },
}), ctrl.register);

router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true },
}), ctrl.login);

router.get('/me', requireAuth, ctrl.me);

module.exports = router;
