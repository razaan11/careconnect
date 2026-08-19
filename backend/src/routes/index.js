const express = require('express');

const authRoutes = require('./auth.routes');
const donationsRoutes = require('./donations.routes');
const trustsRoutes = require('./trusts.routes');
const volunteersRoutes = require('./volunteers.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/donations', donationsRoutes);
router.use('/trusts', trustsRoutes);
router.use('/volunteers', volunteersRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
