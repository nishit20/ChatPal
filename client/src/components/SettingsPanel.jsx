import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ProfilePictureUpload from './ProfilePictureUpload';

const SettingsPanel = ({ onClose, user: propUser }) => {
  const { logout, user: contextUser, login } = useContext(AuthContext);
  const user = contextUser || propUser;
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  
  // Initialize settings from user data
  const [settings, setSettings] = useState({
    notifications: user?.notifications || {
      messageNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      desktopNotifications: true,
    },
    privacy: user?.privacy || {
      lastSeenVisible: true,
      profileVisible: true,
      onlineStatusVisible: true,
      readReceipts: true,
      typingIndicators: true,
    },
    language: user?.language || 'en',
    theme: 'auto',
    compactMode: localStorage.getItem('compactMode') === 'true',
    account: {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      loginAlerts: user?.loginAlerts !== undefined ? user.loginAlerts : true,
    },
  });

  // Username edit state and handler
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || '');

  // Sync settings with user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        notifications: user.notifications || prev.notifications,
        privacy: user.privacy || prev.privacy,
        language: user.language || prev.language,
        account: {
          twoFactorEnabled: user.twoFactorEnabled !== undefined ? user.twoFactorEnabled : prev.account.twoFactorEnabled,
          loginAlerts: user.loginAlerts !== undefined ? user.loginAlerts : prev.account.loginAlerts,
        },
      }));
    }
  }, [user]);

  const handleSaveUsername = async () => {
    // TODO: Implement backend call to update username
    setEditingUsername(false);
    // Optionally show a success message
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ];

  const handleSettingChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let obj = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      
      // Save compact mode to localStorage
      if (path === 'compactMode') {
        localStorage.setItem('compactMode', value);
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('compactModeChanged', { detail: value }));
      }
      
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const updates = {
        privacy: settings.privacy,
        notifications: settings.notifications,
        language: settings.language,
        twoFactorEnabled: settings.account.twoFactorEnabled,
        loginAlerts: settings.account.loginAlerts,
      };

      const userId = user.id || user._id;
      await api.instance.put(`/users/${userId}`, updates);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert('Please fill in all fields');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.instance.post('/users/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      alert('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Please enter your password to confirm account deletion');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      await api.instance.delete('/users/account', {
        data: { password: deletePassword },
      });
      alert('Account deleted successfully');
      logout();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      console.log('Logout confirmed');
      logout();
      onClose();
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'language', label: 'Language', icon: '🌐' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col overflow-hidden animate-modal"
    >
      {/* Header */}
      <div className="border-b dark:border-gray-700 p-4 flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 animate-holographic">
        <h2 className="text-xl font-bold text-white text-glow">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition hover-glow"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 whitespace-nowrap transition font-medium animate-tab ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 text-glow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-hologram'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                General Settings
              </h3>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: '☀️ Light', bg: 'bg-white border-2' },
                    { value: 'dark', label: '🌙 Dark', bg: 'bg-gray-800 border-2' },
                    { value: 'auto', label: '🔄 Auto', bg: 'bg-gradient-to-r from-white to-gray-800 border-2' },
                  ].map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => handleSettingChange('theme', theme.value)}
                      className={`flex-1 p-3 rounded-lg transition ${
                        settings.theme === theme.value
                          ? `${theme.bg} border-blue-500`
                          : `${theme.bg} border-gray-300 dark:border-gray-600`
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Compact Mode</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reduce spacing and padding for more messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* Chat Effects */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Chat Effects</span>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* Emoji Suggestions */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Emoji Suggestions</span>
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-5 h-5 rounded"
                />
              </div>
            </motion.div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Privacy & Safety
              </h3>

              {[
                {
                  key: 'lastSeenVisible',
                  label: 'Last Seen',
                  desc: 'Let others see when you were last active',
                },
                {
                  key: 'profileVisible',
                  label: 'Profile Visibility',
                  desc: 'Allow others to view your profile',
                },
                {
                  key: 'onlineStatusVisible',
                  label: 'Online Status',
                  desc: 'Show when you are online',
                },
                {
                  key: 'readReceipts',
                  label: 'Read Receipts',
                  desc: 'Show when you have read messages',
                },
                {
                  key: 'typingIndicators',
                  label: 'Typing Indicators',
                  desc: 'Show when you are typing',
                },
              ].map(setting => (
                <motion.div
                  key={setting.key}
                  whileHover={{ x: 4 }}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{setting.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{setting.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy[setting.key]}
                    onChange={e => handleSettingChange(`privacy.${setting.key}`, e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </motion.div>
              ))}

              {/* Block List */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition font-bold tracking-wide text-base shadow-sm"
              >
                Blocked Users 🚫
              </motion.button>
            </motion.div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notifications
              </h3>

              {[
                {
                  key: 'messageNotifications',
                  label: 'Message Notifications',
                  desc: 'Get notified for new messages',
                  icon: '💬',
                },
                {
                  key: 'soundEnabled',
                  label: 'Notification Sounds',
                  desc: 'Play sound for notifications',
                  icon: '🔊',
                },
                {
                  key: 'vibrationEnabled',
                  label: 'Vibration',
                  desc: 'Vibrate for notifications',
                  icon: '📳',
                },
                {
                  key: 'desktopNotifications',
                  label: 'Desktop Notifications',
                  desc: 'Show desktop notifications',
                  icon: '🖥️',
                },
              ].map(setting => (
                <motion.div
                  key={setting.key}
                  whileHover={{ x: 4 }}
                  className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {setting.icon} {setting.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{setting.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications[setting.key]}
                    onChange={e =>
                      handleSettingChange(`notifications.${setting.key}`, e.target.checked)
                    }
                    className="w-5 h-5 rounded"
                  />
                </motion.div>
              ))}

              {/* Notification Tone */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notification Sound
                </label>
                <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                  <option>Default (Ping)</option>
                  <option>Bell</option>
                  <option>Chime</option>
                  <option>Whistle</option>
                  <option>Silent</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Language Settings */}
          {activeTab === 'language' && (
            <motion.div
              key="language"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Language & Region
              </h3>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Language
                </label>
                <select
                  value={settings.language}
                  onChange={e => handleSettingChange('language', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supported Languages Grid */}
              <div className="grid grid-cols-2 gap-2">
                {languages.map(lang => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSettingChange('language', lang.code)}
                    className={`p-3 rounded-lg transition font-medium ${
                      settings.language === lang.code
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {lang.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-4 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Settings
              </h3>

              {/* User Info */}
              
              {/* Profile Picture */}
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Profile Picture</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.avatar || user?.profilePicture ? (
                      <img 
                        src={user.avatar || user.profilePicture} 
                        alt={user.fullName || user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(user?.fullName || user?.name || 'U')?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowProfilePicture(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium text-sm"
                  >
                    {user?.avatar || user?.profilePicture ? 'Change Photo' : 'Add Photo'}
                  </motion.button>
                </div>
              </div>

              {/* Username Edit */}
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
                  {editingUsername ? (
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b border-blue-400 focus:outline-none focus:border-blue-600 transition w-32"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.username || 'user'}</p>
                  )}
                </div>
                {editingUsername ? (
                  <div className="flex gap-2">
                    <button onClick={handleSaveUsername} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm">Save</button>
                    <button onClick={() => { setEditingUsername(false); setUsernameInput(user?.username || ''); }} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition text-sm font-bold">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingUsername(true)} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg transition text-sm font-bold">Edit Username</button>
                )}
              </div>

              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.email || 'not set'}
                </p>
              </div>

              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.phoneNumber || 'not set'}
                </p>
              </div>

              {/* Two-Factor Authentication */}
              <motion.div
                whileHover={{ x: 4 }}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Two-Factor Auth</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Add extra security to your account
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.account.twoFactorEnabled}
                  onChange={e => handleSettingChange('account.twoFactorEnabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </motion.div>

              {/* Login Alerts */}
              <motion.div
                whileHover={{ x: 4 }}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Login Alerts</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Get notified of new login attempts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.account.loginAlerts}
                  onChange={e => handleSettingChange('account.loginAlerts', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </motion.div>

              {/* Change Password */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowChangePassword(true)}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-bold tracking-wide text-base shadow-sm"
              >
                Change Password 🔑
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-bold tracking-wide text-base shadow-sm"
              >
                Log Out 🚪
              </motion.button>

              {/* Delete Account */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition font-bold tracking-wide text-base shadow-sm"
              >
                Delete My Account 🗑️
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition font-bold tracking-wide text-base shadow-sm"
        >
          {loading ? 'Saving...' : 'Save & Close'}
        </motion.button>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowChangePassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition font-medium"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                  }}
                  className="flex-1 p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 p-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition font-medium"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="flex-1 p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Picture Upload Modal */}
      <AnimatePresence>
        {showProfilePicture && (
          <ProfilePictureUpload
            currentPicture={user?.avatar || user?.profilePicture || ''}
            userName={user?.fullName || user?.name || 'User'}
            onClose={() => setShowProfilePicture(false)}
            onUpload={async (url) => {
              // Refresh user data from backend
              try {
                const userId = user?.id || user?._id;
                if (userId) {
                  const response = await api.instance.get(`/users/${userId}`);
                  if (response.data.success) {
                    const authData = JSON.parse(localStorage.getItem('chat_auth') || '{}');
                    if (authData.token) {
                      login({
                        token: authData.token,
                        user: response.data.user
                      });
                    }
                  }
                }
              } catch (error) {
                console.error('Error refreshing user data:', error);
              }
              setShowProfilePicture(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPanel;
