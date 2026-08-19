// One-time-password generation and delivery via email. This
// environment has no real SMTP credentials configured, so email
// sending failures are logged and swallowed rather than crashing the
// request that triggered them.

const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * Generates a random 6-digit numeric OTP as a string (zero-padded).
 */
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
}

function buildTransport() {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a plain-text OTP email. `type` is a short label describing
 * what the OTP is for (e.g. "pickup", "delivery") used in the subject
 * line. Never throws — logs and swallows any error so a missing/mock
 * SMTP config doesn't break the calling request.
 */
async function sendOTPEmail(email, otp, type = 'verification') {
  try {
    const transporter = buildTransport();

    await transporter.sendMail({
      from: env.EMAIL_USER || 'noreply@careconnect.org',
      to: email,
      subject: `CareConnect ${type} OTP`,
      text: `Your CareConnect ${type} OTP is: ${otp}\n\nThis code is required to confirm the ${type} step of your donation. Do not share it with anyone else.`,
    });

    console.log(`[otpService] OTP email sent to ${email} for ${type}`);
  } catch (err) {
    console.error(`[otpService] Failed to send OTP email to ${email}:`, err.message);
  }
}

module.exports = { generateOTP, sendOTPEmail };
