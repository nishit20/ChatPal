const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  phoneNumber: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true }, // Stored as hashed password
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  // Backward compatibility fields (will be populated from main fields)
  name: { type: String }, // Alias for fullName
  profilePicture: { type: String }, // Alias for avatar
  onlineStatus: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  // Privacy Settings
  privacy: {
    lastSeenVisible: { type: Boolean, default: true },
    profileVisible: { type: Boolean, default: true },
    onlineStatusVisible: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    typingIndicators: { type: Boolean, default: true },
  },
  // Notification Settings
  notifications: {
    messageNotifications: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    desktopNotifications: { type: Boolean, default: true },
    notificationSound: { type: String, default: 'default' },
  },
  // Language Settings
  language: { type: String, default: 'en' },
  // Account Settings
  twoFactorEnabled: { type: Boolean, default: false },
  loginAlerts: { type: Boolean, default: true },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Contacts/Friends
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Pre-save middleware to sync backward compatibility fields
UserSchema.pre('save', function(next) {
  try {
    // Enforce at least one contact field
    if (!this.email && !this.phoneNumber) {
      return next(new Error('Either email or phone number is required'));
    }

    // Sync name with fullName
    if (this.isModified('fullName') && !this.name) {
      this.name = this.fullName;
    } else if (this.isModified('name') && !this.fullName) {
      this.fullName = this.name;
    }
    
    // Sync profilePicture with avatar
    if (this.isModified('avatar') && !this.profilePicture) {
      this.profilePicture = this.avatar;
    } else if (this.isModified('profilePicture') && !this.avatar) {
      this.avatar = this.profilePicture;
    }
    
    // Sync isOnline with onlineStatus
    if (this.isModified('isOnline')) {
      this.onlineStatus = this.isOnline ? 'online' : 'offline';
    } else if (this.isModified('onlineStatus')) {
      this.isOnline = this.onlineStatus === 'online';
    }
    
    next();
  } catch (error) {
    console.error('❌ Pre-save middleware error:', error);
    next(error);
  }
});

// Indexes for unique constraints
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true });

// Transform toJSON to automatically exclude passwordHash (only when converting to JSON for responses)
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
