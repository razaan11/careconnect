const express = require('express');
const { getPendingTrusts, getStats } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/trusts/pending', authenticate, authorize('ADMIN'), getPendingTrusts);

router.get('/stats', authenticate, authorize('ADMIN'), getStats);

module.exports = router;
