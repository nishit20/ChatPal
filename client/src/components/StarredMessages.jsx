import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const StarredMessages = ({ chatId, onSelectMessage, onClose }) => {
  const [starredMessages, setStarredMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStarredMessages();
  }, [chatId]);

  const fetchStarredMessages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/chats/${chatId}/starred`);
      setStarredMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching starred messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstar = async (messageId) => {
    try {
      await axios.post(`/api/chats/${chatId}/unstar`, { messageId });
      setStarredMessages((prev) =>
        prev.filter((msg) => msg._id !== messageId)
      );
    } catch (error) {
      console.error('Error unstarring message:', error);
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

  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-96 mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="border-b dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ⭐ Starred Messages ({starredMessages.length})
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}
          {!isLoading && starredMessages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No starred messages yet. ⭐
            </div>
          )}

          <AnimatePresence>
            {starredMessages.map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
              >
                <div className="flex gap-3 items-start">
                  <span className="text-lg flex-shrink-0">
                    {getTypeIcon(message.type)}
                  </span>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onSelectMessage?.(message);
                      onClose?.();
                    }}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-words font-medium">
                      {truncateText(message.content)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnstar(message._id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition text-yellow-500 hover:text-yellow-600"
                    title="Remove star"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StarredMessages;
