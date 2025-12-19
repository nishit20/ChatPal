const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Debug logging (no PII)
const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/19de1faf-0c8e-405e-a9bb-8ec68df77bfb';
const safeLog = (payload) => {
  try {
    fetch(DEBUG_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'debug-session', timestamp: Date.now(), ...payload }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
};

const isCloudinaryConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

const saveToLocalUploads = async (fileBuffer, originalName) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(originalName || '') || '';
  const safeExt = ext && ext.length <= 10 ? ext : '';
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
  const absPath = path.join(uploadsDir, name);
  await fs.promises.writeFile(absPath, fileBuffer);
  return { filename: name };
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }

    // #region agent log
    safeLog({
      runId: 'upload-run',
      hypothesisId: 'upload-start',
      location: 'uploadController.js:uploadFile',
      message: 'uploadFile called',
      data: { hasFile: true, size: req.file?.size, mimetype: req.file?.mimetype, cloudinary: isCloudinaryConfigured() },
    });
    // #endregion
    
    // If Cloudinary isn't configured, fall back to local storage so uploads work in dev.
    if (!isCloudinaryConfigured()) {
      const { filename } = await saveToLocalUploads(req.file.buffer, req.file.originalname);
      const url = `/uploads/${filename}`;
      return res.json({
        success: true,
        url, // backward compat for existing frontend
        data: { url },
      });
    }

    const streamifier = require('streamifier');
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'chat_files' }, 
      (error, result) => {
        if (error) {
          // #region agent log
          safeLog({
            runId: 'upload-run',
            hypothesisId: 'upload-error',
            location: 'uploadController.js:uploadFile:cloudinary',
            message: 'cloudinary upload error',
            data: { error: error.message },
          });
          // #endregion
          return res.status(500).json({ 
            success: false, 
            message: 'Upload error', 
            error: error.message 
          });
        }
        return res.json({ 
          success: true,
          url: result.secure_url, // backward compat for existing frontend
          data: { 
            url: result.secure_url, 
            public_id: result.public_id 
          } 
        });
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) { 
    console.error('Upload file error:', err); 
    // #region agent log
    safeLog({
      runId: 'upload-run',
      hypothesisId: 'upload-exception',
      location: 'uploadController.js:uploadFile:catch',
      message: 'uploadFile exception',
      data: { error: err.message },
    });
    // #endregion
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    }); 
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    console.log('📸 Upload profile picture controller called');
    console.log('Request file:', req.file ? `Present - ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})` : 'Missing');
    console.log('Request user:', req.user ? `Present - ${req.user._id}` : 'Missing');
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    
    if (!req.user) {
      console.error('❌ No user in request (auth failed)');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF' 
      });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB' 
      });
    }

    const streamifier = require('streamifier');
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'profile_pictures', transformation: [{ width: 400, height: 400, crop: 'fill' }] },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Upload error', error: error.message });
        }

        try {
          // Update user's avatar and profilePicture
          const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
              avatar: result.secure_url,
              profilePicture: result.secure_url 
            },
            { new: true }
          ).select('-passwordHash -password');

          res.json({ 
            success: true, 
            url: result.secure_url, // backward compat for existing frontend
            data: {
              url: result.secure_url, 
              public_id: result.public_id,
              user 
            }
          });
        } catch (err) {
          console.error('Error updating user:', err);
          res.status(500).json({ success: false, message: 'Error updating user profile' });
        }
      }
    );
    
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error('Upload profile picture error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadFile, uploadProfilePicture };
