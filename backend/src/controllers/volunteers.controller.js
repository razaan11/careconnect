// Volunteer profile management: registration, browsing available
// pickups sorted by proximity, accepting a pickup, and delivery
// history.

const prisma = require('../config/db');
const { haversine } = require('../services/matchingEngine');
const { generateOTP: generateOtpCode } = require('../services/otpService');

/**
 * Creates a VolunteerProfile for the calling user. The user must
 * already have role VOLUNTEER and not already have a profile.
 */
async function registerVolunteer(req, res) {
  try {
    if (req.user.role !== 'VOLUNTEER') {
      return res.status(403).json({ error: 'Only users with role VOLUNTEER can register a volunteer profile' });
    }

    const existing = await prisma.volunteerProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ error: 'A volunteer profile already exists for this user' });
    }

    const { vehicleType, currentLat, currentLng } = req.body;

    const volunteerProfile = await prisma.volunteerProfile.create({
      data: {
        userId: req.user.id,
        vehicleType: vehicleType || null,
        currentLat: currentLat != null ? Number(currentLat) : null,
        currentLng: currentLng != null ? Number(currentLng) : null,
      },
    });

    return res.status(201).json({ volunteerProfile });
  } catch (err) {
    console.error('[volunteers.registerVolunteer]', err);
    return res.status(500).json({ error: 'Failed to register volunteer profile' });
  }
}

/**
 * Returns the caller's own VolunteerProfile — used by the web
 * dashboard's activity/stats view (actual pickup actions stay
 * mobile-only, but web can show progress read-only).
 */
async function getMyProfile(req, res) {
  try {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: req.user.id } });
    if (!volunteerProfile) {
      return res.status(404).json({ error: 'No volunteer profile found for this user' });
    }
    return res.json({ volunteerProfile });
  } catch (err) {
    console.error('[volunteers.getMyProfile]', err);
    return res.status(500).json({ error: 'Failed to load volunteer profile' });
  }
}

/**
 * Lists donations that are MATCHED and not yet claimed by a
 * volunteer, sorted by distance from the given lat/lng query params
 * (nearest first). Each donation gets a `distanceKm` field attached.
 */
async function listPickups(req, res) {
  try {
    const { lat, lng } = req.query;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const originLat = Number(lat);
    const originLng = Number(lng);

    if (Number.isNaN(originLat) || Number.isNaN(originLng)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    const donations = await prisma.donation.findMany({
      where: { status: 'MATCHED', volunteerId: null },
      include: { donor: true, matchedTrust: true },
    });

    const withDistance = donations
      .map((donation) => ({
        ...donation,
        distanceKm: haversine(originLat, originLng, donation.lat, donation.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({ pickups: withDistance });
  } catch (err) {
    console.error('[volunteers.listPickups]', err);
    return res.status(500).json({ error: 'Failed to list pickups' });
  }
}

/**
 * Assigns the caller as the volunteer for a donation, moves it to
 * PICKUP_SCHEDULED, and generates a deliveryOtp for later delivery
 * confirmation.
 */
async function acceptPickup(req, res) {
  try {
    const { id } = req.params;

    const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: req.user.id } });
    if (!volunteerProfile) {
      return res.status(404).json({ error: 'No volunteer profile found for this user' });
    }

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.status !== 'MATCHED' || donation.volunteerId) {
      return res.status(400).json({ error: 'This donation is not available for pickup' });
    }

    const deliveryOtp = generateOtpCode();

    const updated = await prisma.donation.update({
      where: { id },
      data: {
        volunteerId: volunteerProfile.id,
        status: 'PICKUP_SCHEDULED',
        deliveryOtp,
      },
    });

    return res.json({ donation: updated });
  } catch (err) {
    console.error('[volunteers.acceptPickup]', err);
    return res.status(500).json({ error: 'Failed to accept pickup' });
  }
}

/**
 * Lists the caller's completed (DELIVERED) donations.
 */
async function getHistory(req, res) {
  try {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: req.user.id } });
    if (!volunteerProfile) {
      return res.status(404).json({ error: 'No volunteer profile found for this user' });
    }

    const donations = await prisma.donation.findMany({
      where: { volunteerId: volunteerProfile.id, status: 'DELIVERED' },
      include: { donor: true, matchedTrust: true },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ donations });
  } catch (err) {
    console.error('[volunteers.getHistory]', err);
    return res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
}

module.exports = { registerVolunteer, getMyProfile, listPickups, acceptPickup, getHistory };
