import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';

const NewGroupModal = ({ onClose, onCreate }) => {
  const { theme } = useContext(ThemeContext);
  const [step, setStep] = useState(1); // 1: name, 2: members, 3: confirm
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch real users from backend
  useEffect(() => {
    if (searchQuery.length >= 1) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.instance.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.data && res.data.success) {
            // Exclude already selected users
            const filtered = res.data.users.filter(
              (u) => !selectedUsers.some((su) => su._id === u._id)
            );
            setAvailableUsers(filtered);
          } else {
            setAvailableUsers([]);
          }
        } catch (err) {
          setAvailableUsers([]);
        }
      }, 300);
    } else {
      setAvailableUsers([]);
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, selectedUsers]);

  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      return isSelected
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user];
    });
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    setLoading(true);
    try {
      // Prepare member IDs for backend
      const memberIds = selectedUsers.map(u => u._id);
      const payload = {
        name: groupName,
        memberIds,
        avatar: profilePicture,
      };
      const response = await api.instance.post('/groups/create', payload);
      const newGroup = response.data;
      // Optionally add extra frontend fields for UI
      newGroup.lastMessage = 'Group created';
      newGroup.unreadCount = 0;
      newGroup.isGroup = true;
      onCreate(newGroup);
      setLoading(false);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePicture(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed inset-0 ${
        theme === 'dark' ? 'bg-black/50' : 'bg-black/30'
      } z-50 flex items-center justify-center p-4 animate-modal`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl flex flex-col sci-fi-card animate-holographic`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between animate-holographic`}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-glow`}>
              👥 Create New Group
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-hologram`}>
              Step {step} of 3
            </p>
          </motion.div>
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✕
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className={`h-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Group Name & Description */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    autoFocus
                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Add a group description..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none resize-none ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Group Picture (Optional)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                      theme === 'dark'
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {profilePicture ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={profilePicture}
                          alt="Group"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-3xl">📷</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Click to upload group picture
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Members */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Search & Add Members
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className={`w-full px-4 py-2 rounded-lg border transition focus:outline-none ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Selected Members */}
                {selectedUsers.length > 0 && (
                  <div>
                    <p className={`text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Selected: {selectedUsers.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <motion.div
                          key={user._id}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                            theme === 'dark'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <span className="text-sm font-medium">{user.name}</span>
                          <button
                            onClick={() => handleRemoveUser(user._id)}
                            className="ml-1 hover:opacity-70 transition"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Users */}
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <motion.button
                      key={user._id}
                      onClick={() => handleToggleUser(user)}
                      whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(0, 0, 0, 0.03)' }}
                      className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.username}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 transition ${
                        selectedUsers.some((u) => u._id === user._id)
                          ? 'bg-blue-500 border-blue-500'
                          : theme === 'dark'
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      }`} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={groupName}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                      {groupName[0]}
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {groupName}
                  </h3>
                  {groupDescription && (
                    <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {groupDescription}
                    </p>
                  )}
                </div>

                <div>
                  <p className={`text-sm font-semibold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Members ({selectedUsers.length})
                  </p>
                  <div className="space-y-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`p-3 rounded-lg flex items-center gap-3 ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    ℹ️ You can add or remove members after creating the group
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Buttons */}
        <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-6 flex items-center justify-between gap-3`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-white'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (step === 3) {
                handleCreateGroup();
              } else {
                setStep(step + 1);
              }
            }}
            disabled={
              (step === 1 && !groupName.trim()) ||
              (step === 2 && selectedUsers.length === 0) ||
              loading
            }
            className="px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-medium transition"
          >
            {loading ? '⏳ Creating...' : step === 3 ? '✓ Create Group' : 'Next'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewGroupModal;
