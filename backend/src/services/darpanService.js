// Simulated NGO Darpan verification. Real NGO Darpan (India's
// government NGO registry, run by NITI Aayog) has no public self-serve
// API — integrating with it for real requires formal government
// registration that isn't available here. This service does the part
// that's genuinely checkable without that access: validating the ID
// follows Darpan's real-world format, then checking it against a small
// mock registry to simulate an actual database lookup. A format-valid
// ID that isn't in the mock registry isn't rejected — it just doesn't
// auto-verify, and falls back to the existing admin review queue.

// Real Darpan unique IDs look like "KA/2020/0245789" — a 2-letter
// state code, the registration year, and a 7-digit serial number.
const DARPAN_ID_FORMAT = /^[A-Z]{2}\/\d{4}\/\d{7}$/;

// Stand-in for a real government registry lookup. Includes the two
// seeded demo trusts plus a few unused entries so you can register a
// *new* trust during a live demo and watch it auto-verify instantly.
const MOCK_REGISTRY = new Set([
  'TN/2019/0123456', // Hope Children's Home (seeded)
  'WB/2020/0456789', // Sunshine Elders Shelter (seeded)
  'KA/2021/0987654', // unused — try this one live
  'MH/2018/0345678', // unused — try this one live
  'DL/2022/0765432', // unused — try this one live
]);

function isValidFormat(darpanId) {
  return typeof darpanId === 'string' && DARPAN_ID_FORMAT.test(darpanId.trim().toUpperCase());
}

function isInRegistry(darpanId) {
  return MOCK_REGISTRY.has(darpanId.trim().toUpperCase());
}

/**
 * Checks a Darpan ID and decides whether it can be auto-verified.
 * Returns { formatValid, autoVerified, reason }. Never throws —
 * an ID that doesn't format-check is caught by the caller as a
 * validation error before this is even reached in normal use, but
 * this stays defensive regardless.
 */
function verifyDarpanId(darpanId) {
  if (!isValidFormat(darpanId)) {
    return { formatValid: false, autoVerified: false, reason: 'invalid_format' };
  }
  if (isInRegistry(darpanId)) {
    return { formatValid: true, autoVerified: true, reason: 'found_in_registry' };
  }
  return { formatValid: true, autoVerified: false, reason: 'not_in_registry' };
}

module.exports = { DARPAN_ID_FORMAT, isValidFormat, verifyDarpanId };
