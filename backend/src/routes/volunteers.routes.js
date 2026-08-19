const express = require('express');
const {
  registerVolunteer,
  listPickups,
  acceptPickup,
  getHistory,
} = require('../controllers/volunteers.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authenticate, authorize('VOLUNTEER'), registerVolunteer);

router.get('/pickups', authenticate, authorize('VOLUNTEER'), listPickups);

router.post('/pickups/:id/accept', authenticate, authorize('VOLUNTEER'), acceptPickup);

router.get('/history', authenticate, authorize('VOLUNTEER'), getHistory);

module.exports = router;
