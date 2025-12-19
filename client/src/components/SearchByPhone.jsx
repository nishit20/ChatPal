import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchByPhone = ({ onClose, onSelectUser }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const formatPhoneNumber = (num) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSearched(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await fetch(
        `http://127.0.0.1:5000/api/users/searchByPhone?phone=${encodeURIComponent(formattedPhone)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('User not found');
      }

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.users || []);
        if (!data.users || data.users.length === 0) {
          setError('No users found with this phone number');
        }
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to search');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📱 Search by Phone
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-green-50 text-sm mt-2">Find friends using their phone number</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">+</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="1 234 567 8900"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter phone number with country code
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Searching...
                </>
              ) : (
                <>
                  🔍 Search
                </>
              )}
            </motion.button>
          </form>

          {/* Results */}
          <AnimatePresence>
            {searched && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6"
              >
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    {searchResults.map((user, index) => (
                      <motion.button
                        key={user._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectUser(user)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username || 'nouser'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              📱 {user.phoneNumber || 'No phone'}
                            </p>
                          </div>

                          {/* Online Status */}
                          <div className="flex flex-col items-end gap-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                user.onlineStatus === 'online'
                                  ? 'bg-green-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {user.onlineStatus === 'online'
                                ? 'Online'
                                : `Last seen`}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No users found with this phone number
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          {!searched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2"
            >
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">💡 Tips:</p>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>✓ Use format: +1 234 567 8900</li>
                <li>✓ Or just: 1234567890</li>
                <li>✓ Search by any saved phone number</li>
                <li>✓ Results show online status</li>
              </ul>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchByPhone;
