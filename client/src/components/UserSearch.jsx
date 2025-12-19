import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import OnlineIndicator from './OnlineIndicator';

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function (300ms delay)
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.instance.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setResults(response.data.users || []);
        setShowResults(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search (300ms)
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleSelectUser = (user) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Telegram-style search bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="text-gray-500 dark:text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.length >= 2 && results.length > 0 && setShowResults(true)}
          placeholder="Search by name, username, or phone"
          className="flex-1 bg-transparent outline-none text-sm dark:text-white placeholder-gray-400"
        />
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {showResults && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                {query.length >= 2 ? 'No users found' : 'Type at least 2 characters to search'}
              </div>
            ) : (
              <div className="py-2">
                {results.map((user) => (
                  <motion.button
                    key={user.userId || user._id}
                    onClick={() => handleSelectUser(user)}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName || user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">
                          {(user.fullName || user.name || 'U')?.[0]?.toUpperCase()}
                        </span>
                      )}
                      {/* Online indicator */}
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm dark:text-white truncate">
                        {user.fullName || user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                        {user.phoneNumber && ` • ${user.phoneNumber}`}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSearch;
