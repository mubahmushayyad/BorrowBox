const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/itemsController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/mine', requireAuth, ctrl.mine); // must be defined before /:id
router.post('/upload-image', requireAuth, upload.single('image'), ctrl.uploadImage); // must be defined before /:id
router.get('/:id/availability', ctrl.availability);
router.get('/:id', ctrl.getOne);

router.post('/', requireAuth, validate({
  title: { required: true, min: 2 },
  categoryId: { required: true, type: 'number' },
  condition: { required: true, enum: ['new', 'good', 'fair'] },
  maxDays: { required: true, type: 'number' },
}), ctrl.create);

router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
