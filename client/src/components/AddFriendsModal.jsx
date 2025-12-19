import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import apiWrapper from '../services/api';

const AddFriendsModal = ({ onClose }) => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('search'); // search, suggestions, pending
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const { instance } = apiWrapper;
      const res = await instance.get('/users/search', { params: { q: searchQuery } });
      const users = res.data?.users || [];
      // Normalize for UI
      const normalized = users.map(u => ({
        id: u.userId || u._id,
        name: u.fullName || u.name || u.username,
        username: u.username ? `@${u.username}` : '',
        status: u.isOnline ? 'online' : 'offline',
        mutual: u.mutual || 0,
        raw: u
      }));
      setSearchResults(normalized);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friend) => {
    try {
      setErrorMsg('');
      setStatusMsg('');
      const { instance } = apiWrapper;
      await instance.post('/contacts/add', { userId: friend.id });
      setSentRequests(prev => [...prev, friend.id]);
      setFriends(prev => [...prev, friend]);
      setStatusMsg(`${friend.name} added to your contacts`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add friend');
      console.error('Add friend error:', err);
    }
  };

  const handleAcceptRequest = async (friend) => {
    try {
      setErrorMsg('');
      setStatusMsg('');
      const { instance } = apiWrapper;
      await instance.post('/contacts/add', { userId: friend.id });
      setFriends(prev => [...prev, friend]);
      setPendingRequests(prev => prev.filter(p => p.id !== friend.id));
      setStatusMsg(`${friend.name} added to your contacts`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept request');
      console.error('Accept friend error:', err);
    }
  };

  const tabs = [
    { id: 'search', label: '🔍 Search', icon: '🔍' },
    { id: 'pending', label: '⏳ Pending', icon: '⏳' },
  ];

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
              Add Friends
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-hologram`}>
              Find and add new friends to your chat list
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

        {/* Tab Navigation */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} px-6 flex gap-4`}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 font-medium relative transition ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="underline"
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-t ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                  }`}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Status / Error */}
        {(statusMsg || errorMsg) && (
          <div className={`px-6 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} text-sm`}>
            {statusMsg && <div className="text-green-500">{statusMsg}</div>}
            {errorMsg && <div className="text-red-500">{errorMsg}</div>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-4"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, username, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className={`flex-1 px-4 py-2 rounded-lg border transition focus:outline-none ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition"
                  >
                    {loading ? '⏳' : '🔍'}
                  </motion.button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg flex items-center justify-between ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(user.name || '?')[0]}
                          </div>
                          <div>
                            <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {user.name}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {user.username} • {user.mutual} mutual friends
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddFriend(user)}
                          disabled={sentRequests.includes(user.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            sentRequests.includes(user.id)
                              ? theme === 'dark'
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-200 text-gray-600'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {sentRequests.includes(user.id) ? '✓ Sent' : '➕ Add'}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !loading && (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-lg">😅 No users found</p>
                    <p className="text-sm">Try searching with different keywords</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-3"
              >
                {pendingRequests.length === 0 ? (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-lg">✨ All caught up!</p>
                    <p className="text-sm">No pending friend requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                              {(request.name || '?')[0]}
                        </div>
                        <div>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {request.name}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {request.from ? 'Sent you a request' : 'Waiting for response'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.from && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAcceptRequest(request)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
                            >
                              ✓
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-4 py-2 rounded-lg font-medium transition ${
                                theme === 'dark'
                                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                              }`}
                            >
                              ✕
                            </motion.button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddFriendsModal;
