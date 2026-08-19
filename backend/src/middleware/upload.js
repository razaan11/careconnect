// Multer configured with Cloudinary storage for donation photo proof
// uploads. Accepts up to 5 images under the field name "photos".

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'careconnect/donation-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

module.exports = upload;
