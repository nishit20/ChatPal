const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Debug route to check if routes are registered (no auth needed for testing)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload routes are working', 
    routes: ['POST /api/upload/profile-picture', 'POST /api/upload/'],
    timestamp: new Date().toISOString()
  });
});

// More specific routes must come before generic routes
// Profile picture upload route
router.post('/profile-picture', auth, upload.single('file'), uploadController.uploadProfilePicture);

router.post('/', auth, upload.single('file'), uploadController.uploadFile);

// Multer error handler (file too large, invalid multipart, etc.)
router.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  return next(err);
});

module.exports = router;
