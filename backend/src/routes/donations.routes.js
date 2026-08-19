const express = require('express');
const { body } = require('express-validator');
const {
  createDonation,
  listDonations,
  uploadPhotoProof,
  confirmDelivery,
  browseNeeds,
} = require('../controllers/donations.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/browse-needs', authenticate, authorize('DONOR'), browseNeeds);

router.post(
  '/',
  authenticate,
  authorize('DONOR'),
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.type').isIn(['FOOD', 'CLOTHES', 'BOOKS']).withMessage('Each item type must be FOOD, CLOTHES, or BOOKS'),
    body('items.*.title').trim().notEmpty().withMessage('Each item needs a title'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be a positive integer'),
    body('items.*.unit').trim().notEmpty().withMessage('Each item needs a unit'),
    body('pincode').trim().notEmpty().withMessage('pincode is required'),
    body('district').trim().notEmpty().withMessage('district is required'),
    body('state').trim().notEmpty().withMessage('state is required'),
  ],
  validate,
  createDonation
);

router.get('/', authenticate, listDonations);

router.post('/:id/photo-proof', authenticate, authorize('VOLUNTEER'), upload.array('photos', 5), uploadPhotoProof);

router.post(
  '/:id/confirm-delivery',
  authenticate,
  authorize('VOLUNTEER'),
  [body('otp').trim().notEmpty().withMessage('otp is required')],
  validate,
  confirmDelivery
);

module.exports = router;
