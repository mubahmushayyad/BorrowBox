const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingsController');
const reviewCtrl = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(requireAuth);

router.post('/', validate({
  itemId: { required: true, type: 'number' },
  startDate: { required: true, type: 'date' },
  endDate: { required: true, type: 'date' },
}), ctrl.create);

router.get('/mine', ctrl.mine);
router.get('/incoming', ctrl.incoming);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

router.patch('/:id/status', validate({
  action: { required: true, enum: ['approve', 'reject', 'cancel', 'pickup', 'return'] },
}), ctrl.changeStatus);

router.post('/:id/reviews', validate({
  rating: { required: true, type: 'number' },
}), reviewCtrl.create);

module.exports = router;
