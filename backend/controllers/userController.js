const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Format phone number for consistent searching
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

// Validate phone number format
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
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
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, fullName, bio, profilePicture, avatar, language, privacy, notifications, twoFactorEnabled, loginAlerts } = req.body;
    const userId = req.params.id;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (fullName) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (avatar) updates.avatar = avatar;
    if (language) updates.language = language;
    if (privacy) updates.privacy = privacy;
    if (notifications) updates.notifications = notifications;
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled;
    if (loginAlerts !== undefined) updates.loginAlerts = loginAlerts;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-passwordHash -password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    const currentUserId = req.user._id;

    // Validate query length (min 2 chars)
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    // Build search query
    // Partial match on fullName and username (case-insensitive)
    // Exact match on phoneNumber
    const searchQuery = {
      _id: { $ne: currentUserId }, // Exclude current logged-in user
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }, // Backward compatibility
        { username: { $regex: q, $options: 'i' } }
      ]
    };

    // Try exact phone number match
    if (validatePhoneNumber(q)) {
      const formattedPhone = formatPhoneNumber(q);
      searchQuery.$or.push({ phoneNumber: formattedPhone });
    }

    // Perform search with limit of 20 users
    const users = await User.find(searchQuery)
      .select('-passwordHash -password')
      .limit(20)
      .lean();

    // Format response with required fields
    const formattedUsers = users.map(user => ({
      userId: user._id,
      fullName: user.fullName || user.name,
      username: user.username,
      avatar: user.avatar || user.profilePicture,
      isOnline: user.isOnline !== undefined ? user.isOnline : (user.onlineStatus === 'online'),
      phoneNumber: user.phoneNumber,
      email: user.email
    }));

    res.json({ success: true, users: formattedUsers });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const searchByPhone = async (req, res) => {
  try {
    const phone = req.query.phone;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const user = await User.findOne({ phoneNumber: formattedPhone }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, users: [user] });
  } catch (err) {
    console.error('Search by phone error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: '',
        profilePicture: '' 
      },
      { new: true }
    ).select('-passwordHash -password');

    res.json({ success: true, user });
  } catch (err) {
    console.error('Remove profile picture error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Password hash not found for user' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const bcrypt = require('bcrypt');
    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Password hash not found for user' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password is incorrect' });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Contact/Friend management
const addContact = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as a contact' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    
    // Check if already a contact (using blockedUsers array as contacts for now, or add contacts field)
    // For now, we'll add a contacts field to User model
    if (!currentUser.contacts) {
      currentUser.contacts = [];
    }

    if (currentUser.contacts.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already in your contacts' });
    }

    currentUser.contacts.push(userId);
    await currentUser.save();

    res.json({
      success: true,
      data: {
        message: 'Contact added successfully',
        contact: {
          id: targetUser._id,
          fullName: targetUser.fullName || targetUser.name,
          username: targetUser.username,
          avatar: targetUser.avatar || targetUser.profilePicture,
          isOnline: targetUser.isOnline
        }
      }
    });

  } catch (err) {
    console.error('Add contact error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'fullName name username avatar profilePicture isOnline lastSeen phoneNumber email')
      .select('contacts');

    const contacts = (user.contacts || []).map(contact => ({
      id: contact._id,
      fullName: contact.fullName || contact.name,
      username: contact.username,
      avatar: contact.avatar || contact.profilePicture,
      isOnline: contact.isOnline,
      lastSeen: contact.lastSeen,
      phoneNumber: contact.phoneNumber,
      email: contact.email
    }));

    res.json({
      success: true,
      data: contacts
    });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeContact = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);
    if (!user.contacts) {
      user.contacts = [];
    }

    user.contacts = user.contacts.filter(
      contactId => contactId.toString() !== id
    );

    await user.save();

    res.json({
      success: true,
      data: { message: 'Contact removed successfully' }
    });
  } catch (err) {
    console.error('Remove contact error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  getMe,
  getUser, 
  updateUser, 
  searchUsers, 
  searchByPhone, 
  removeProfilePicture, 
  changePassword, 
  deleteAccount,
  addContact,
  getContacts,
  removeContact
};
