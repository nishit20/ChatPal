const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const TOKEN_EXPIRES_IN = '30d';

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const obj = userDoc.toJSON ? userDoc.toJSON() : userDoc.toObject ? userDoc.toObject() : userDoc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.passwordHash;
  delete obj.password;
  return obj;
};

const formatPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
};

const isValidPhone = (phone) => /^\+?[\d\s\-()]{10,}$/.test((phone || '').replace(/\s/g, ''));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

const register = async (req, res) => {
  try {
    console.log('📝 Register request received:', JSON.stringify(req.body).substring(0, 100));
    const { fullName, username, email, phoneNumber, password } = req.body || {};
    const trimmedName = (fullName || '').trim();
    const normalizedUsername = (username || '').trim().toLowerCase();
    const normalizedEmail = (email || '').trim().toLowerCase() || undefined;
    const normalizedPhone = phoneNumber ? formatPhone(phoneNumber) : undefined;

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'fullName is required' });
    }
    if (!normalizedUsername) {
      return res.status(400).json({ success: false, message: 'username is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'password must be at least 6 characters' });
    }
    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'email or phoneNumber is required' });
    }
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'invalid email format' });
    }
    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'invalid phone number format' });
    }

    // Uniqueness checks
    const existing = await User.findOne({
      $or: [
        { username: normalizedUsername },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
      ],
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username, email, or phone number already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: trimmedName,
      username: normalizedUsername,
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      passwordHash,
      isOnline: false,
      lastSeen: new Date(),
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    const safeUser = sanitizeUser(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: safeUser,
      },
      // Backward-compatibility fields for existing frontend clients
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('❌ Register error:', err.message);
    console.error('Full error:', err);
    // Handle duplicate key errors explicitly
    if (err?.code === 11000 && err?.keyPattern) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    const trimmedIdentifier = (identifier || '').trim();
    if (!trimmedIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'identifier and password are required' });
    }

    const maybeEmail = isValidEmail(trimmedIdentifier) ? trimmedIdentifier.toLowerCase() : null;
    const maybePhone = isValidPhone(trimmedIdentifier) ? formatPhone(trimmedIdentifier) : null;

    const user = await User.findOne({
      $or: [
        { username: trimmedIdentifier.toLowerCase() },
        ...(maybeEmail ? [{ email: maybeEmail }] : []),
        ...(maybePhone ? [{ phoneNumber: maybePhone }] : []),
      ],
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    const safeUser = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: safeUser,
      },
      // Backward-compatibility fields for existing frontend clients
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const safeUser = sanitizeUser(user);
    return res.status(200).json({ success: true, data: safeUser, user: safeUser });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  me,
};

