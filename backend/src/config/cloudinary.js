// Configures the Cloudinary v2 SDK from environment variables.
// In this environment there are no real Cloudinary credentials, so
// uploads will fail until a real account is plugged into .env — the
// configuration itself is still valid and complete.

const cloudinary = require('cloudinary').v2;
const env = require('./env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
