// Food-safety checks for FOOD-type donations, plus a daily cron job
// that auto-expires stale food donations.

const cron = require('node-cron');
const prisma = require('../config/db');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Determines whether a food donation is safe to accept based on its
 * expiry date.
 *   - No expiryDate at all -> unsafe (FOOD donations must state one).
 *   - Expiry already in the past -> unsafe.
 *   - Less than 1 full day remaining -> unsafe (too close to expiry
 *     to realistically pick up, verify, and deliver in time).
 *   - Otherwise -> safe, with the number of whole days left.
 */
function checkFoodSafety(expiryDate) {
  if (!expiryDate) {
    return { safe: false, daysLeft: null, message: 'Expiry date is required for food donations' };
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return { safe: false, daysLeft: null, message: 'Invalid expiry date' };
  }

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = diffMs / MS_PER_DAY;

  if (diffMs <= 0) {
    return { safe: false, daysLeft: 0, message: 'This item has already expired' };
  }

  if (daysLeft < 1) {
    return {
      safe: false,
      daysLeft,
      message: 'This item expires in less than a day, which is too soon to safely match and deliver',
    };
  }

  return {
    safe: true,
    daysLeft,
    message: `Safe to donate: ${Math.floor(daysLeft)} day(s) remaining before expiry`,
  };
}

/**
 * Schedules a daily job (midnight) that marks any FOOD donation whose
 * expiryDate has passed, and that hasn't already been delivered or
 * marked expired, as EXPIRED.
 */
function scheduleExpiryCheck() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await prisma.donation.updateMany({
        where: {
          type: 'FOOD',
          status: { notIn: ['DELIVERED', 'EXPIRED'] },
          expiryDate: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });
      console.log(`[foodSafety] Expiry sweep complete: ${result.count} donation(s) marked EXPIRED`);
    } catch (err) {
      console.error('[foodSafety] Expiry sweep failed:', err);
    }
  });

  console.log('[foodSafety] Daily expiry check scheduled (00:00)');
}

module.exports = { checkFoodSafety, scheduleExpiryCheck };
