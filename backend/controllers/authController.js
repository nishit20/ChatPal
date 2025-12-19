const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Validation utilities
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPhoneNumber = (phone) => {
  const value = typeof phone === 'string' ? phone : String(phone || '');
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

// Debug logging helper for debug mode (safe, no-throw)
const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/19de1faf-0c8e-405e-a9bb-8ec68df77bfb';
const safeLog = (payload) => {
  try {
    const f = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');
    f(DEBUG_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        timestamp: Date.now(),
        ...payload,
      })
    }).catch(() => {});
  } catch (e) {
    // Swallow logging errors to avoid impacting runtime
  }
};

const register = async (req, res) => {
  try {
    const { fullName, username, phoneNumber, email, password } = req.body;
    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H1',
      location: 'authController.js:register:start',
      message: 'register start',
      data: {
        hasFullName: !!fullName,
        hasUsername: !!username,
        hasPhone: !!phoneNumber,
        hasEmail: !!email,
        hasPassword: !!password
      },
      timestamp: Date.now()
    });
    // #endregion
    
    // Validate required fields
    if (!fullName || !username || !password) {
      // #region agent log
      safeLog({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H2',
        location: 'authController.js:register:missingRequired',
        message: 'missing required fields',
        data: { fullName: !!fullName, username: !!username, password: !!password },
        timestamp: Date.now()
      });
      // #endregion
      return res.status(400).json({ 
        success: false,
        message: 'Full name, username, and password are required' 
      });
    }

    // Validate either phone or email is provided
    if (!phoneNumber && !email) {
      // #region agent log
      safeLog({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H2',
        location: 'authController.js:register:noContact',
        message: 'no phone or email',
        data: {},
        timestamp: Date.now()
      });
      // #endregion
      return res.status(400).json({ 
        success: false,
        message: 'Either phone number or email is required' 
      });
    }

    // Validate phone number format if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      // #region agent log
      safeLog({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H3',
        location: 'authController.js:register:badPhone',
        message: 'invalid phone',
        data: { phoneNumber },
        timestamp: Date.now()
      });
      // #endregion
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format' 
      });
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      // #region agent log
      safeLog({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H3',
        location: 'authController.js:register:badEmail',
        message: 'invalid email',
        data: { email },
        timestamp: Date.now()
      });
      // #endregion
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Format phone number
    const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : null;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        ...(formattedPhone ? [{ phoneNumber: formattedPhone }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H4',
      location: 'authController.js:register:existingUserCheck',
      message: 'existing user lookup done',
      data: { found: !!existingUser, hasPhone: !!formattedPhone, hasEmail: !!email },
      timestamp: Date.now()
    });
    // #endregion

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, phone number, or email already in use' 
      });
    }

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      fullName,
      username,
      phoneNumber: formattedPhone,
      email: email || null,
      passwordHash,
      isOnline: false,
      lastSeen: new Date()
    });

    try {
      await user.save();
    } catch (saveError) {
      // Handle duplicate key errors (unique constraint violations)
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} is already in use`
        });
      }
      throw saveError; // Re-throw if it's not a duplicate key error
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    // Return user data (toJSON will automatically exclude passwordHash)
    const userData = user.toJSON ? user.toJSON() : {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      phoneNumber: user.phoneNumber,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };

    res.json({
      success: true,
      token,
      user: userData
    });

    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H5',
      location: 'authController.js:register:success',
      message: 'register success',
      data: { userId: user._id?.toString() },
      timestamp: Date.now()
    });
    // #endregion
  } catch (err) {
    console.error('❌ Register error:', err.message);
    console.error('Full error:', err);
    console.error('Stack:', err.stack);
    // #region agent log
    safeLog({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H6',
      location: 'authController.js:register:error',
      message: 'register exception',
      data: { error: err.message },
      timestamp: Date.now()
    });
    // #endregion
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('🔵 Login request received');
    const { identifier, password } = req.body;
    const identifierStr = typeof identifier === 'string' ? identifier.trim() : String(identifier || '').trim();
    console.log('🔵 Identifier:', identifierStr ? 'provided' : 'missing');
    console.log('🔵 Password:', password ? 'provided' : 'missing');

    // #region agent log
    safeLog({runId:'run1',hypothesisId:'H1',location:'authController.js:login:start',message:'login start',data:{identifierStr,hasPassword:!!password}});
    // #endregion

    if (!identifierStr || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required'
      });
    }

    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. State:', mongoose.connection.readyState);
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H2',location:'authController.js:login:dbState',message:'db not connected',data:{state:mongoose.connection.readyState}});
      // #endregion
      return res.status(503).json({
        success: false,
        message: 'Database not connected. Please try again.'
      });
    }

    // Build search criteria
    const searchCriteria = {
      $or: [
        { username: identifierStr },
        { email: identifierStr }
      ]
    };

    // Add phone number if it looks like a phone
    if (validatePhoneNumber(identifierStr)) {
      const formattedPhone = formatPhoneNumber(identifierStr);
      console.log('🔵 Formatted phone:', formattedPhone);
      searchCriteria.$or.push({ phoneNumber: formattedPhone });
    }

    console.log('🔵 Search criteria:', JSON.stringify(searchCriteria));
    // #region agent log
    safeLog({runId:'run1',hypothesisId:'H1',location:'authController.js:login:criteria',message:'search criteria',data:{criteria:searchCriteria}});
    // #endregion

    // Find user
    let user;
    try {
      user = await User.findOne(searchCriteria);
      console.log('🔵 User found:', !!user);
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H3',location:'authController.js:login:userQuery',message:'user query result',data:{found:!!user,userId:user?._id?.toString(),hasHash:!!user?.passwordHash}});
      // #endregion
    } catch (queryErr) {
      console.error('❌ Database query error:', queryErr);
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H2',location:'authController.js:login:userQueryError',message:'user query error',data:{error:queryErr?.message}});
      // #endregion
      throw queryErr;
    }
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.passwordHash) {
      console.error('❌ User has no password hash');
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H3',location:'authController.js:login:noHash',message:'user missing password hash',data:{userId:user?._id?.toString()}});
      // #endregion
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    let match;
    try {
      match = await bcrypt.compare(password, user.passwordHash);
      console.log('🔵 Password match:', match);
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H4',location:'authController.js:login:compare',message:'bcrypt compare result',data:{match}});
      // #endregion
    } catch (bcryptErr) {
      console.error('❌ Bcrypt error:', bcryptErr);
      // #region agent log
      safeLog({runId:'run1',hypothesisId:'H4',location:'authController.js:login:compareError',message:'bcrypt error',data:{error:bcryptErr?.message}});
      // #endregion
      throw bcryptErr;
    }

    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update online status
    try {
      await User.updateOne(
        { _id: user._id },
        { isOnline: true, lastSeen: new Date() }
      );
    } catch (updateErr) {
      console.error('⚠️ Failed to update online status:', updateErr);
      // Continue anyway
    }

    // Generate token
    let token;
    try {
      token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );
      console.log('🔵 Token generated');
    } catch (tokenErr) {
      console.error('❌ JWT error:', tokenErr);
      throw tokenErr;
    }

    // Return user data - use toJSON if available, otherwise build manually
    let userData;
    try {
      if (user.toJSON && typeof user.toJSON === 'function') {
        userData = user.toJSON();
        // Ensure id is a string
        if (userData._id) {
          userData.id = String(userData._id);
          delete userData._id;
        }
      } else {
        // Build manually
        const userObj = user.toObject ? user.toObject() : user;
        userData = {
          id: String(userObj._id || user._id),
          fullName: userObj.fullName || userObj.name || '',
          username: userObj.username || '',
          phoneNumber: userObj.phoneNumber || '',
          email: userObj.email || '',
          avatar: userObj.avatar || userObj.profilePicture || '',
          bio: userObj.bio || '',
          isOnline: true,
          lastSeen: new Date().toISOString(),
          language: userObj.language || 'en',
          privacy: userObj.privacy || {},
          notifications: userObj.notifications || {},
          twoFactorEnabled: userObj.twoFactorEnabled || false,
          loginAlerts: userObj.loginAlerts !== undefined ? userObj.loginAlerts : true
        };
      }
      console.log('🔵 User data prepared');
    } catch (jsonError) {
      console.error('❌ Error preparing user data:', jsonError);
      // Fallback
      userData = {
        id: String(user._id),
        fullName: user.fullName || user.name || '',
        username: user.username || '',
        isOnline: true
      };
    }

    console.log('✅ Login successful');
    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (err) {
    console.error('❌❌❌ LOGIN ERROR:', err.message);
    console.error('Error type:', err.constructor.name);
    console.error('Full error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        type: err.constructor.name 
      })
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Verify user still exists
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (err) {
    console.error('❌ Refresh token error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

const logout = async (req, res) => {
  try {
    // Update user offline status
    await User.updateOne(
      { _id: req.user._id },
      { 
        isOnline: false, 
        lastSeen: new Date() 
      }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('❌ Logout error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName || user.name,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar || user.profilePicture,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        language: user.language,
        privacy: user.privacy,
        notifications: user.notifications,
        twoFactorEnabled: user.twoFactorEnabled,
        loginAlerts: user.loginAlerts
      }
    });
  } catch (err) {
    console.error('❌ Get me error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
