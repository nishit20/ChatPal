import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const MessageSearch = ({ chatId, onSelectMessage, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, text, image, file, voice
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, filterType]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/chats/${chatId}/search`, {
        params: {
          q: searchQuery,
          type: filterType === 'all' ? '' : filterType,
        },
      });
      setResults(response.data.messages || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectMessage?.(results[selectedIndex]);
        onClose?.();
      }
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const getTypeIcon = (messageType) => {
    switch (messageType) {
      case 'image':
        return '🖼️';
      case 'file':
        return '📎';
      case 'voice':
        return '🎤';
      case 'video':
        return '🎥';
      default:
        return '💬';
    }
  };

  const truncateText = (text, maxLength = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 z-50 shadow-lg"
    >
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'text', 'image', 'file', 'voice'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading && (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          )}
          {!isLoading && results.length === 0 && searchQuery && (
            <div className="text-center py-4 text-gray-500">No messages found</div>
          )}
          {!isLoading && results.length === 0 && !searchQuery && (
            <div className="text-center py-4 text-gray-500">
              Start typing to search messages
            </div>
          )}

          <AnimatePresence>
            {results.map((message, index) => (
              <motion.button
                key={message._id}
                onClick={() => {
                  onSelectMessage?.(message);
                  onClose?.();
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`w-full text-left p-2 rounded-lg transition ${
                  selectedIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex gap-2">
                  <span className="text-lg">{getTypeIcon(message.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                      {truncateText(message.content)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageSearch;
