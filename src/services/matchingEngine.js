// Core matching logic: pairs a new donation with the best-fit verified
// trust, based on distance, the trust's stated urgency for that
// donation type, and whether the trust is verified.

const prisma = require('../config/db');

const URGENCY_POINTS = {
  LOW: 5,
  MEDIUM: 15,
  HIGH: 25,
  CRITICAL: 30,
};

const MAX_DISTANCE_POINTS = 40;
const MAX_VERIFICATION_POINTS = 10;
const MAX_POSSIBLE_SCORE = MAX_DISTANCE_POINTS + URGENCY_POINTS.CRITICAL + MAX_VERIFICATION_POINTS; // 80

const MAX_MATCH_DISTANCE_KM = 10;

/**
 * Converts a raw score to a 0-100 "match %" for donor-facing display —
 * e.g. "98% match" — normalized against the highest score any (need,
 * trust) pair could possibly reach (closest possible distance +
 * CRITICAL urgency + verified).
 */
function toMatchPercent(score) {
  return Math.max(0, Math.min(100, Math.round((score / MAX_POSSIBLE_SCORE) * 100)));
}

/**
 * Great-circle distance between two lat/lng points, in kilometers.
 */
function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Scores how well a trust matches a donation. `trust` must already
 * have its `needs` relation included. A trust's location comes from
 * its own lat/lng (geocoded from the address it registered with);
 * `trust.user`'s lat/lng is used only as a fallback for older records
 * that predate per-trust addresses. Returns null if the trust has no
 * active matching need for this donation type, or if either side's
 * location couldn't be resolved (e.g. the pincode geocode failed), or
 * if they're too far apart.
 */
function scoreTrust(donation, trust) {
  const matchingNeed = (trust.needs || []).find(
    (need) => need.type === donation.type && need.isActive
  );

  if (!matchingNeed) {
    return null;
  }

  if (donation.lat == null || donation.lng == null) {
    return null;
  }

  const trustLat = trust.lat != null ? trust.lat : trust.user?.lat;
  const trustLng = trust.lng != null ? trust.lng : trust.user?.lng;

  if (trustLat == null || trustLng == null) {
    return null;
  }

  const distKm = haversine(donation.lat, donation.lng, trustLat, trustLng);

  if (distKm > MAX_MATCH_DISTANCE_KM) {
    return null;
  }

  const distancePoints = Math.max(0, MAX_DISTANCE_POINTS - distKm * 4);
  const urgencyPoints = URGENCY_POINTS[matchingNeed.urgency] || 0;
  const verificationPoints = trust.isVerified ? MAX_VERIFICATION_POINTS : 0;

  const score = distancePoints + urgencyPoints + verificationPoints;

  return {
    trustId: trust.id,
    needId: matchingNeed.id,
    score,
    distKm,
  };
}

/**
 * Scores a single (need, trust) pair for donor-facing "browse needs"
 * discovery. Unlike scoreTrust, this isn't tied to matching a specific
 * donation's type, and it never excludes a need for being far away —
 * distance just contributes fewer points the farther it is. If the
 * donor's location couldn't be resolved (donorLat/donorLng null),
 * distance is left out of the score entirely rather than zeroed, so
 * browsing still ranks sensibly by urgency alone.
 */
function scoreNeed(need, trust, donorLat, donorLng) {
  const urgencyPoints = URGENCY_POINTS[need.urgency] || 0;
  const verificationPoints = trust.isVerified ? MAX_VERIFICATION_POINTS : 0;

  let distKm = null;
  let distancePoints = 0;
  if (donorLat != null && donorLng != null && trust.lat != null && trust.lng != null) {
    distKm = haversine(donorLat, donorLng, trust.lat, trust.lng);
    distancePoints = Math.max(0, MAX_DISTANCE_POINTS - distKm * 4);
  }

  return {
    needId: need.id,
    trustId: trust.id,
    score: distancePoints + urgencyPoints + verificationPoints,
    distKm,
  };
}

/**
 * Finds the best-matching verified trust for a donation. Returns the
 * highest-scoring {trustId, needId, score, distKm} result, or null if
 * no verified trust has a matching, nearby, active need.
 */
async function matchDonation(donation) {
  const trusts = await prisma.trust.findMany({
    where: { isVerified: true },
    include: {
      needs: { where: { type: donation.type, isActive: true } },
      user: true,
    },
  });

  let best = null;

  for (const trust of trusts) {
    const result = scoreTrust(donation, trust);
    if (result && (!best || result.score > best.score)) {
      best = result;
    }
  }

  return best;
}

module.exports = {
  haversine,
  scoreTrust,
  scoreNeed,
  matchDonation,
  toMatchPercent,
  MAX_MATCH_DISTANCE_KM,
  MAX_POSSIBLE_SCORE,
  URGENCY_POINTS,
};
