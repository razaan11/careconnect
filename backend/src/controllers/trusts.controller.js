// Trust (NGO/orphanage/etc.) profile management: registration,
// admin verification, need posting, and pickup OTP generation.

const prisma = require('../config/db');
const { generateOTP: generateOtpCode, sendOTPEmail } = require('../services/otpService');
const { geocodePincode } = require('../services/geocode');
const { verifyDarpanId } = require('../services/darpanService');

/**
 * Creates a Trust profile for the calling user. The user must already
 * have role TRUST (set at registration) and not already have a trust
 * profile. The darpanId is checked with verifyDarpanId: a correctly
 * formatted ID found in the (simulated) NGO Darpan registry
 * auto-verifies the trust immediately; otherwise it's created
 * unverified, pending admin review.
 */
async function registerTrust(req, res) {
  try {
    if (req.user.role !== 'TRUST') {
      return res.status(403).json({ error: 'Only users with role TRUST can register a trust profile' });
    }

    const { orgName, darpanId, landmark, pincode, district, state } = req.body;
    if (!orgName || !darpanId) {
      return res.status(400).json({ error: 'orgName and darpanId are required' });
    }
    if (!pincode || !district || !state) {
      return res.status(400).json({ error: 'pincode, district, and state are required' });
    }

    const darpanCheck = verifyDarpanId(darpanId);
    if (!darpanCheck.formatValid) {
      return res.status(400).json({
        error: 'That doesn\'t look like a valid NGO Darpan ID — expected format: XX/YYYY/NNNNNNN (e.g. KA/2020/0245789)',
      });
    }

    const existing = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ error: 'A trust profile already exists for this user' });
    }

    const geo = await geocodePincode({ pincode, district, state });

    const trust = await prisma.trust.create({
      data: {
        userId: req.user.id,
        orgName,
        darpanId: darpanId.trim().toUpperCase(),
        landmark: landmark || null,
        pincode,
        district,
        state,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        isVerified: darpanCheck.autoVerified,
        verifiedAt: darpanCheck.autoVerified ? new Date() : null,
        verifiedBy: darpanCheck.autoVerified ? 'system:darpan-registry' : null,
      },
    });

    return res.status(201).json({ trust, autoVerified: darpanCheck.autoVerified });
  } catch (err) {
    console.error('[trusts.registerTrust]', err);
    return res.status(500).json({ error: 'Failed to register trust' });
  }
}

/**
 * TRUST only. Returns the caller's own Trust profile — used by the
 * trust dashboard to show its own verification status.
 */
async function getMyTrust(req, res) {
  try {
    const trust = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (!trust) {
      return res.status(404).json({ error: 'No trust profile found for this user' });
    }
    return res.json({ trust });
  } catch (err) {
    console.error('[trusts.getMyTrust]', err);
    return res.status(500).json({ error: 'Failed to load trust profile' });
  }
}

/**
 * ADMIN only. Marks a trust (by :id param) as verified.
 */
async function verifyTrust(req, res) {
  try {
    const { id } = req.params;

    const trust = await prisma.trust.findUnique({ where: { id } });
    if (!trust) {
      return res.status(404).json({ error: 'Trust not found' });
    }

    const updated = await prisma.trust.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
      },
    });

    return res.json({ trust: updated });
  } catch (err) {
    console.error('[trusts.verifyTrust]', err);
    return res.status(500).json({ error: 'Failed to verify trust' });
  }
}

/**
 * TRUST only. Posts a new need (e.g. "50 winter blankets, HIGH
 * urgency") for the caller's own trust.
 */
async function postNeed(req, res) {
  try {
    const trust = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (!trust) {
      return res.status(404).json({ error: 'No trust profile found for this user' });
    }

    const { type, title, description, urgency } = req.body;
    const validTypes = ['FOOD', 'CLOTHES', 'BOOKS'];
    if (!type || !validTypes.includes(type) || !title) {
      return res.status(400).json({ error: `type (one of ${validTypes.join(', ')}) and title are required` });
    }

    const validUrgencies = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (urgency && !validUrgencies.includes(urgency)) {
      return res.status(400).json({ error: `urgency must be one of ${validUrgencies.join(', ')}` });
    }

    const need = await prisma.trustNeed.create({
      data: {
        trustId: trust.id,
        type,
        title,
        description: description || null,
        urgency: urgency || 'MEDIUM',
      },
    });

    return res.status(201).json({ need });
  } catch (err) {
    console.error('[trusts.postNeed]', err);
    return res.status(500).json({ error: 'Failed to post need' });
  }
}

/**
 * TRUST only. Lists the caller's trust's currently active needs.
 */
async function getNeeds(req, res) {
  try {
    const trust = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (!trust) {
      return res.status(404).json({ error: 'No trust profile found for this user' });
    }

    const needs = await prisma.trustNeed.findMany({
      where: { trustId: trust.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ needs });
  } catch (err) {
    console.error('[trusts.getNeeds]', err);
    return res.status(500).json({ error: 'Failed to list needs' });
  }
}

/**
 * TRUST only. Soft-deletes (deactivates) a need belonging to the
 * caller's trust.
 */
async function deleteNeed(req, res) {
  try {
    const { id } = req.params;

    const trust = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (!trust) {
      return res.status(404).json({ error: 'No trust profile found for this user' });
    }

    const need = await prisma.trustNeed.findUnique({ where: { id } });
    if (!need || need.trustId !== trust.id) {
      return res.status(404).json({ error: 'Need not found' });
    }

    const updated = await prisma.trustNeed.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ need: updated });
  } catch (err) {
    console.error('[trusts.deleteNeed]', err);
    return res.status(500).json({ error: 'Failed to delete need' });
  }
}

/**
 * TRUST only. Generates a pickup OTP for a donation matched to the
 * caller's trust, saves it, and (best-effort) emails it to the
 * assigned volunteer if one exists yet.
 */
async function generateOTP(req, res) {
  try {
    const { donationId } = req.params;

    const trust = await prisma.trust.findUnique({ where: { userId: req.user.id } });
    if (!trust) {
      return res.status(404).json({ error: 'No trust profile found for this user' });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { volunteer: { include: { user: true } } },
    });

    if (!donation || donation.matchedTrustId !== trust.id) {
      return res.status(404).json({ error: 'Donation not found for this trust' });
    }

    const pickupOtp = generateOtpCode();

    const updated = await prisma.donation.update({
      where: { id: donationId },
      data: { pickupOtp },
    });

    if (donation.volunteer && donation.volunteer.user && donation.volunteer.user.email) {
      await sendOTPEmail(donation.volunteer.user.email, pickupOtp, 'pickup');
    }

    return res.json({ pickupOtp: updated.pickupOtp });
  } catch (err) {
    console.error('[trusts.generateOTP]', err);
    return res.status(500).json({ error: 'Failed to generate OTP' });
  }
}

module.exports = { registerTrust, getMyTrust, verifyTrust, postNeed, getNeeds, deleteNeed, generateOTP };
