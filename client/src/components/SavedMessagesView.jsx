import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const SavedMessagesView = ({ onClose }) => {
  const { theme } = useContext(ThemeContext);
  const [savedMessages] = useState([
    {
      id: 1,
      text: 'Important meeting notes - Project deadline extended to next month',
      sender: 'Self Note',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: 2,
      text: 'Birthday reminder - Mom birthday on Dec 25th',
      sender: 'Self Note',
      timestamp: new Date(Date.now() - 86400000),
      type: 'text'
    },
    {
      id: 3,
      text: 'Check: React hooks best practices',
      sender: 'Self Note',
      timestamp: new Date(Date.now() - 172800000),
      type: 'text'
    },
    {
      id: 4,
      text: 'Password: Update all security keys by Dec 31st',
      sender: 'Self Note',
      timestamp: new Date(Date.now() - 259200000),
      type: 'text'
    },
  ]);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
        className={`w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden ${
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
              ⭐ Saved Messages
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-hologram`}>
              {savedMessages.length} saved message{savedMessages.length !== 1 ? 's' : ''}
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

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {savedMessages.length === 0 ? (
            <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-lg font-semibold">No saved messages yet</p>
              <p className="text-sm">Star messages to save them for later</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {savedMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(0, 0, 0, 0.03)' }}
                  className={`p-4 rounded-lg border transition ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-500 text-lg">⭐</span>
                        <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {msg.sender}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                      <p className={`text-sm break-words ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {msg.text}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 rounded-lg text-lg flex-shrink-0 ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                      title="Copy"
                    >
                      📋
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 text-center`}>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedMessagesView;
