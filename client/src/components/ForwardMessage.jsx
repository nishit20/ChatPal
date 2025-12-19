import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ForwardMessage = ({ message, user, onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/chats');
      // Filter out current chat
      const filtered = response.data.chats.filter(
        (chat) => chat._id !== message.chatId
      );
      setChats(filtered);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = (chatId) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) {
      alert('Please select at least one chat');
      return;
    }

    setIsSending(true);
    try {
      await Promise.all(
        selectedChats.map((chatId) =>
          axios.post(`/api/chats/${chatId}/forward`, {
            originalMessageId: message._id,
            content: message.content,
            type: message.type,
          })
        )
      );
      alert(`Message forwarded to ${selectedChats.length} chat(s)`);
      onClose?.();
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message');
    } finally {
      setIsSending(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroup) {
      return chat.name;
    }
    // Get other user's name
    const otherUser = chat.members.find((m) => m._id !== user?._id);
    return otherUser?.name || 'Unknown';
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
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-96 mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="border-b dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ↗️ Forward Message
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
            <div className="text-center py-8 text-gray-500">Loading chats...</div>
          )}

          <AnimatePresence>
            {chats.map((chat) => (
              <motion.button
                key={chat._id}
                onClick={() => toggleChat(chat._id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                  selectedChats.includes(chat._id)
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedChats.includes(chat._id)}
                  onChange={() => {}}
                  className="w-5 h-5 rounded"
                />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {getChatName(chat)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chat.isGroup
                      ? `${chat.members.length} members`
                      : 'Direct message'}
                  </p>
                </div>
                {chat.isGroup && <span className="text-lg">👥</span>}
              </motion.button>
            ))}
          </AnimatePresence>

          {!isLoading && chats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No other chats available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t dark:border-gray-700 p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0 || isSending}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition"
          >
            {isSending
              ? 'Forwarding...'
              : `Forward (${selectedChats.length})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForwardMessage;
