// Converts a pincode + district + state into approximate lat/lng, so
// donors and trusts never have to touch GPS or coordinates directly —
// they fill in an address like they would at online checkout, and the
// existing distance-based matching engine keeps working underneath.
// Uses OpenStreetMap's free Nominatim search API (no API key needed).

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Resolves { pincode, district, state } to { lat, lng }. Returns null
 * (never throws) if the lookup fails or the pincode can't be
 * resolved — callers should treat that as "location unknown" and fall
 * back gracefully (e.g. leave the donation unmatched for manual
 * admin routing) rather than blocking the request.
 */
async function geocodePincode({ pincode, district, state }) {
  if (!pincode) return null;

  // Deliberately no hardcoded country filter: CareConnect's own docs
  // target India, but donors/trusts may register from anywhere, so we
  // let Nominatim resolve the free-text address as given rather than
  // silently discarding correct results from outside one country.
  const query = [pincode, district, state].filter(Boolean).join(', ');
  const url = `${NOMINATIM_URL}?${new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
  })}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CareConnect-Hackathon/1.0' },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng };
  } catch (err) {
    console.error('[geocode.geocodePincode]', err.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { geocodePincode };
