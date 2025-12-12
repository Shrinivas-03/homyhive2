const express = require('express');
const router = express.Router();
const hostController = require('../controllers/hosts');
const { isLoggedIn } = require('../middleware');

// Host registration (main onboarding form)
router.post('/signup', hostController.hostRegister);

// Upload property images and video (AJAX or form-data)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/host-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'propertyImages') {
    // Only allow images
    if (!file.mimetype.startsWith('image/')) return cb(null, false);
  } else if (file.fieldname === 'propertyVideo') {
    // Only allow video
    if (!file.mimetype.startsWith('video/')) return cb(null, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max for video
  fileFilter
});

// Property media upload endpoint
// Save property images/video to Host document for the logged-in user
router.post('/upload-media', isLoggedIn, upload.fields([
  { name: 'propertyImages', maxCount: 5 },
  { name: 'propertyVideo', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Find the host application for this user
    const Host = require('../models/host');
    const host = await Host.findOne({ userId });
    if (!host) {
      return res.status(404).json({ success: false, message: 'Host application not found for user' });
    }

    // Prepare property media info
    const images = (req.files['propertyImages'] || []).map(f => ({ filename: f.filename, path: f.path, uploadedAt: new Date() }));
    const video = req.files['propertyVideo'] && req.files['propertyVideo'][0]
      ? { filename: req.files['propertyVideo'][0].filename, path: req.files['propertyVideo'][0].path, uploadedAt: new Date() }
      : null;

    // Save to host document
    if (!host.propertyMedia) host.propertyMedia = {};
    if (images.length > 0) {
      host.propertyMedia.images = images;
    }
    if (video) {
      host.propertyMedia.video = video;
    }
    await host.save();

    res.json({ success: true, images, video });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
