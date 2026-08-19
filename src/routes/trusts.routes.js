const express = require('express');
const { body } = require('express-validator');
const {
  registerTrust,
  getMyTrust,
  verifyTrust,
  postNeed,
  getNeeds,
  deleteNeed,
  generateOTP,
} = require('../controllers/trusts.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  authenticate,
  authorize('TRUST'),
  [
    body('orgName').trim().notEmpty().withMessage('orgName is required'),
    body('darpanId').trim().notEmpty().withMessage('darpanId is required'),
  ],
  validate,
  registerTrust
);

router.get('/me', authenticate, authorize('TRUST'), getMyTrust);

router.post('/:id/verify', authenticate, authorize('ADMIN'), verifyTrust);

router.post(
  '/needs',
  authenticate,
  authorize('TRUST'),
  [
    body('type').isIn(['FOOD', 'CLOTHES', 'BOOKS']).withMessage('type must be FOOD, CLOTHES, or BOOKS'),
    body('title').trim().notEmpty().withMessage('title is required'),
  ],
  validate,
  postNeed
);

router.get('/needs', authenticate, authorize('TRUST'), getNeeds);

router.delete('/needs/:id', authenticate, authorize('TRUST'), deleteNeed);

router.post('/donations/:donationId/generate-otp', authenticate, authorize('TRUST'), generateOTP);

module.exports = router;
