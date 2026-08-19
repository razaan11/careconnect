// Donation lifecycle: creation (with food-safety check + auto
// matching), role-aware listing, photo-proof upload, and
// OTP-confirmed delivery.

const prisma = require('../config/db');
const { checkFoodSafety } = require('../services/foodSafety');
const { matchDonation, scoreNeed, toMatchPercent } = require('../services/matchingEngine');
const { geocodePincode } = require('../services/geocode');

const VALID_TYPES = ['FOOD', 'CLOTHES', 'BOOKS'];

/**
 * DONOR-facing discovery: ranks every active need across all verified
 * trusts by the same distance+urgency+verification score the auto-
 * matcher uses, so a donor can see who's most in need before they
 * decide what to donate. Query params: pincode (required), district,
 * state. If the pincode can't be geocoded, still returns results
 * ranked by urgency alone rather than failing outright.
 */
async function browseNeeds(req, res) {
  try {
    const { pincode, district, state } = req.query;

    if (!pincode) {
      return res.status(400).json({ error: 'pincode is required' });
    }

    const geo = await geocodePincode({ pincode, district, state });

    const trusts = await prisma.trust.findMany({
      where: { isVerified: true },
      include: { needs: { where: { isActive: true } } },
    });

    const ranked = [];
    for (const trust of trusts) {
      for (const need of trust.needs) {
        const result = scoreNeed(need, trust, geo?.lat ?? null, geo?.lng ?? null);
        ranked.push({
          needId: need.id,
          trustId: trust.id,
          trustName: trust.orgName,
          trustDistrict: trust.district,
          trustState: trust.state,
          type: need.type,
          title: need.title,
          description: need.description,
          urgency: need.urgency,
          distKm: result.distKm,
          score: result.score,
          matchPercent: toMatchPercent(result.score),
        });
      }
    }

    ranked.sort((a, b) => b.score - a.score);

    return res.json({ needs: ranked, locationResolved: !!geo });
  } catch (err) {
    console.error('[donations.browseNeeds]', err);
    return res.status(500).json({ error: 'Failed to load needs' });
  }
}

/**
 * Resolves a donor's chosen trust for one item, if they picked one
 * from the live match preview. Only honored if that trust is still
 * verified and still has an active need for this item's type — a
 * donor could submit minutes after browsing, after a trust closed the
 * need. Returns { trustId, needId } or null (meaning: fall back to
 * auto-match) rather than ever erroring the whole submission out over
 * a stale preference.
 */
async function resolvePreferredTrust(preferredTrustId, type) {
  if (!preferredTrustId) return null;

  const trust = await prisma.trust.findUnique({
    where: { id: preferredTrustId },
    include: { needs: { where: { type, isActive: true } } },
  });

  if (!trust || !trust.isVerified || trust.needs.length === 0) {
    return null;
  }

  return { trustId: trust.id, needId: trust.needs[0].id };
}

/**
 * DONOR only. Creates one or more donations (any mix of FOOD/CLOTHES/
 * BOOKS) from a single pickup address in one request — e.g. a donor
 * can donate food and books together without filling the form twice.
 * Each item still becomes its own Donation row and is matched
 * independently, since a trust needing food and a trust needing books
 * nearby are usually different trusts.
 *
 * Body: { items: [{ type, title, description?, quantity, unit,
 * expiryDate?, preferredTrustId? }], landmark?, pincode, district,
 * state }
 *
 * If an item names a preferredTrustId (the donor picked a specific
 * trust from the live match preview), that trust is used directly
 * instead of running the auto-matcher — as long as it's still
 * verified and still has that need active. Otherwise, or if the
 * chosen trust no longer qualifies, the existing distance+urgency
 * auto-match runs as before.
 *
 * The address is geocoded once (via geocodePincode) and the resulting
 * lat/lng applied to every item, so the existing distance-based
 * matching engine and the volunteer app's GPS-sorted pickup list keep
 * working unchanged — donors and trusts never see or enter
 * coordinates themselves. If geocoding fails, items are still created
 * (with lat/lng left null) so they can be routed manually.
 */
async function createDonation(req, res) {
  try {
    const { items, landmark, pincode, district, state } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    if (!pincode || !district || !state) {
      return res.status(400).json({ error: 'pincode, district, and state are required' });
    }

    for (const item of items) {
      if (!item.type || !VALID_TYPES.includes(item.type)) {
        return res.status(400).json({ error: `Each item's type must be one of ${VALID_TYPES.join(', ')}` });
      }
      if (!item.title || !item.quantity || !item.unit) {
        return res.status(400).json({ error: 'Each item needs a title, quantity, and unit' });
      }
      if (item.type === 'FOOD') {
        const safety = checkFoodSafety(item.expiryDate);
        if (!safety.safe) {
          return res.status(400).json({ error: `"${item.title}": ${safety.message}` });
        }
      }
    }

    const geo = await geocodePincode({ pincode, district, state });

    const created = [];
    for (const item of items) {
      let donation = await prisma.donation.create({
        data: {
          donorId: req.user.id,
          type: item.type,
          title: item.title,
          description: item.description || null,
          quantity: Number(item.quantity),
          unit: item.unit,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          status: 'PENDING',
          photos: [],
          landmark: landmark || null,
          pincode,
          district,
          state,
          lat: geo?.lat ?? null,
          lng: geo?.lng ?? null,
        },
      });

      const preferred = await resolvePreferredTrust(item.preferredTrustId, item.type);
      const match = preferred || (await matchDonation(donation));

      if (match) {
        donation = await prisma.donation.update({
          where: { id: donation.id },
          data: { matchedTrustId: match.trustId, status: 'MATCHED' },
        });
      }

      created.push(donation);
    }

    return res.status(201).json({ donations: created, locationResolved: !!geo });
  } catch (err) {
    console.error('[donations.createDonation]', err);
    return res.status(500).json({ error: 'Failed to create donation' });
  }
}

/**
 * Role-aware donation listing:
 *  - DONOR: only their own donations.
 *  - TRUST: donations matched to their trust.
 *  - VOLUNTEER: available pickups (MATCHED, unassigned) plus any
 *    donations already assigned to them.
 *  - ADMIN: everything.
 */
async function listDonations(req, res) {
  try {
    const { role, id } = req.user;
    let where = {};

    if (role === 'DONOR') {
      where = { donorId: id };
    } else if (role === 'TRUST') {
      const trust = await prisma.trust.findUnique({ where: { userId: id } });
      if (!trust) {
        return res.status(404).json({ error: 'No trust profile found for this user' });
      }
      where = { matchedTrustId: trust.id };
    } else if (role === 'VOLUNTEER') {
      const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: id } });
      if (!volunteerProfile) {
        return res.status(404).json({ error: 'No volunteer profile found for this user' });
      }
      where = {
        OR: [{ status: 'MATCHED' }, { volunteerId: volunteerProfile.id }],
      };
    } else if (role === 'ADMIN') {
      where = {};
    }

    const donations = await prisma.donation.findMany({
      where,
      include: { donor: true, matchedTrust: true, volunteer: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ donations });
  } catch (err) {
    console.error('[donations.listDonations]', err);
    return res.status(500).json({ error: 'Failed to list donations' });
  }
}

/**
 * Appends uploaded photo URLs (from Cloudinary, via the `upload`
 * middleware) to a donation's photos array.
 */
async function uploadPhotoProof(req, res) {
  try {
    const { id } = req.params;

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No photos were uploaded (expected field name "photos")' });
    }

    const newUrls = files.map((file) => file.secure_url || file.path);

    const updated = await prisma.donation.update({
      where: { id },
      data: { photos: { push: newUrls } },
    });

    return res.json({ donation: updated });
  } catch (err) {
    console.error('[donations.uploadPhotoProof]', err);
    return res.status(500).json({ error: 'Failed to upload photo proof' });
  }
}

/**
 * VOLUNTEER confirms final delivery by supplying the deliveryOtp that
 * was generated when they accepted the pickup. On success: donation
 * -> DELIVERED, a DeliveryLog row is created, and the volunteer's
 * totalDeliveries counter is incremented.
 */
async function confirmDelivery(req, res) {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'otp is required' });
    }

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (!donation.deliveryOtp || donation.deliveryOtp !== otp) {
      return res.status(400).json({ error: 'Invalid delivery OTP' });
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({ where: { userId: req.user.id } });
    if (!volunteerProfile || donation.volunteerId !== volunteerProfile.id) {
      return res.status(403).json({ error: 'You are not the assigned volunteer for this donation' });
    }

    const [updatedDonation] = await prisma.$transaction([
      prisma.donation.update({
        where: { id },
        data: { status: 'DELIVERED' },
      }),
      prisma.deliveryLog.create({
        data: {
          donationId: id,
          volunteerId: volunteerProfile.id,
          status: 'DELIVERED',
          photoProofUrl: (donation.photos && donation.photos[donation.photos.length - 1]) || null,
          completedAt: new Date(),
        },
      }),
      prisma.volunteerProfile.update({
        where: { id: volunteerProfile.id },
        data: { totalDeliveries: { increment: 1 } },
      }),
    ]);

    return res.json({ donation: updatedDonation });
  } catch (err) {
    console.error('[donations.confirmDelivery]', err);
    return res.status(500).json({ error: 'Failed to confirm delivery' });
  }
}

module.exports = { createDonation, listDonations, uploadPhotoProof, confirmDelivery, browseNeeds };
