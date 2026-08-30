// Admin-only endpoints: trust verification queue and platform-wide
// stats.

const prisma = require('../config/db');

/**
 * Lists all trusts awaiting verification, with their owning user
 * included.
 */
async function getPendingTrusts(req, res) {
  try {
    const trusts = await prisma.trust.findMany({
      where: { isVerified: false },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ trusts });
  } catch (err) {
    console.error('[admin.getPendingTrusts]', err);
    return res.status(500).json({ error: 'Failed to fetch pending trusts' });
  }
}

/**
 * Returns platform-wide summary stats for the admin dashboard.
 */
async function getStats(req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalDonations, activeTrusts, pendingVerifications, activeVolunteers, deliveredToday, statusGroups] =
      await Promise.all([
        prisma.donation.count(),
        prisma.trust.count({ where: { isVerified: true } }),
        prisma.trust.count({ where: { isVerified: false } }),
        prisma.volunteerProfile.count({ where: { isAvailable: true } }),
        prisma.donation.count({
          where: { status: 'DELIVERED', updatedAt: { gte: startOfToday } },
        }),
        prisma.donation.groupBy({ by: ['status'], _count: { _all: true } }),
      ]);

    const ALL_STATUSES = ['PENDING', 'MATCHED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DELIVERED', 'EXPIRED'];
    const donationsByStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
    for (const group of statusGroups) {
      donationsByStatus[group.status] = group._count._all;
    }

    return res.json({
      totalDonations,
      activeTrusts,
      pendingVerifications,
      activeVolunteers,
      deliveredToday,
      donationsByStatus,
    });
  } catch (err) {
    console.error('[admin.getStats]', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = { getPendingTrusts, getStats };
