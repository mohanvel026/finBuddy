const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for receipts
const receiptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'finbuddy/receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }],
  },
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'finbuddy/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'finbuddy/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 2000, crop: 'limit' }],
  },
});

const uploadReceipt = multer({ storage: receiptStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadPhotoMedia = multer({ storage: photoStorage });

module.exports = { cloudinary, uploadReceipt, uploadAvatar, uploadPhotoMedia };