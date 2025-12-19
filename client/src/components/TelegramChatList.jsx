import React from 'react';
import { motion } from 'framer-motion';

const TelegramChatList = ({ chats, activeChat, onOpenChat }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (msg, length = 35) => {
    if (!msg) return '';
    return msg.length > length ? msg.substring(0, length) + '...' : msg;
  };

  return (
    <div className="divide-y dark:divide-gray-700">
      {chats.map((chat, index) => {
        const isActive = activeChat?._id === chat._id;
        const lastMessage = chat.lastMessage || 'No messages yet';
        const chatName = chat.isGroup ? chat.name : chat.members[0]?.name || 'User';
        const avatar = chat.isGroup ? chat.name?.[0] : chat.members[0]?.name?.[0];
        const isOnline = !chat.isGroup && chat.members[0]?.onlineStatus;

        return (
          <motion.button
            key={chat._id}
            onClick={() => onOpenChat(chat)}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
            className={`w-full px-4 py-3 flex gap-3 transition ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                isActive ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'
              }`}>
                {avatar}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`font-semibold truncate ${
                  isActive ? 'dark:text-white' : 'dark:text-gray-200'
                }`}>
                  {chatName}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {formatTime(chat.updatedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {truncateMessage(lastMessage)}
              </p>
            </div>

            {/* Unread Badge */}
            {Math.random() < 0.1 && (
              <div className="flex-shrink-0 flex items-start">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                  {Math.floor(Math.random() * 10)}
                </span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default TelegramChatList;
