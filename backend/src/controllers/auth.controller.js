// Registration, login, and "who am I" for all roles.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const env = require('../config/env');
const { geocodePincode } = require('../services/geocode');
const { verifyDarpanId } = require('../services/darpanService');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * Registers a new user. If role is TRUST, also creates the associated
 * Trust row (orgName/darpanId required in body) — the darpanId is
 * checked against verifyDarpanId: a correctly-formatted ID found in
 * the (simulated) registry auto-verifies the trust immediately;
 * anything else still creates the trust, just unverified, pending
 * admin review. If role is VOLUNTEER, also creates a VolunteerProfile
 * row (vehicleType optional).
 */
async function register(req, res) {
  try {
    const {
      name, email, password, role, phone, address, lat, lng,
      orgName, darpanId, trustLandmark, trustPincode, trustDistrict, trustState,
      vehicleType,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const normalizedRole = role || 'DONOR';
    const validRoles = ['DONOR', 'TRUST', 'VOLUNTEER', 'ADMIN'];
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: `role must be one of ${validRoles.join(', ')}` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    if (normalizedRole === 'TRUST' && (!orgName || !darpanId)) {
      return res.status(400).json({ error: 'orgName and darpanId are required to register a TRUST' });
    }
    if (normalizedRole === 'TRUST' && (!trustPincode || !trustDistrict || !trustState)) {
      return res.status(400).json({ error: 'trustPincode, trustDistrict, and trustState are required to register a TRUST' });
    }

    let darpanCheck = null;
    if (normalizedRole === 'TRUST') {
      darpanCheck = verifyDarpanId(darpanId);
      if (!darpanCheck.formatValid) {
        return res.status(400).json({
          error: 'That doesn\'t look like a valid NGO Darpan ID — expected format: XX/YYYY/NNNNNNN (e.g. KA/2020/0245789)',
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: normalizedRole,
        phone: phone || null,
        address: address || null,
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
      },
    });

    if (normalizedRole === 'TRUST') {
      const geo = await geocodePincode({
        pincode: trustPincode,
        district: trustDistrict,
        state: trustState,
      });
      await prisma.trust.create({
        data: {
          userId: user.id,
          orgName,
          darpanId: darpanId.trim().toUpperCase(),
          landmark: trustLandmark || null,
          pincode: trustPincode,
          district: trustDistrict,
          state: trustState,
          lat: geo?.lat ?? null,
          lng: geo?.lng ?? null,
          isVerified: darpanCheck.autoVerified,
          verifiedAt: darpanCheck.autoVerified ? new Date() : null,
          verifiedBy: darpanCheck.autoVerified ? 'system:darpan-registry' : null,
        },
      });
    }

    if (normalizedRole === 'VOLUNTEER') {
      await prisma.volunteerProfile.create({
        data: {
          userId: user.id,
          vehicleType: vehicleType || null,
        },
      });
    }

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
      trustVerification: darpanCheck ? { autoVerified: darpanCheck.autoVerified } : undefined,
    });
  } catch (err) {
    console.error('[auth.register]', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Authenticates a user by email + password and returns a fresh JWT.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[auth.login]', err);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}

/**
 * Returns the currently authenticated user (attached by the
 * `authenticate` middleware).
 */
async function getMe(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}

module.exports = { register, login, getMe };
