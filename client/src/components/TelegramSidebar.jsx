import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TelegramMenu from './TelegramMenu';
import TelegramChatList from './TelegramChatList';
import UserSearch from './UserSearch';

const TelegramSidebar = ({ user, chats, activeChat, onOpenChat, onNewChat, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);
  const [showMenu, setShowMenu] = useState(false);

  React.useEffect(() => {
    if (!searchQuery) {
      setFilteredChats(chats);
    } else {
      setFilteredChats(
        chats.filter(
          (chat) =>
            chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, chats]);

  return (
    <div className="w-96 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col h-screen">
      {/* Header with Menu & Search */}
      <div className="p-4 border-b dark:border-gray-700 space-y-4">
        {/* Top Bar with Menu Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            title="Menu"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 15a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold dark:text-white">Telegram Clone</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent ml-3 outline-none dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No chats found' : 'No chats yet. Start a new conversation!'}
          </div>
        ) : (
          <TelegramChatList chats={filteredChats} activeChat={activeChat} onOpenChat={onOpenChat} />
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="p-4 space-y-2 border-t dark:border-gray-700">
        <button
          onClick={() => {
            // Trigger search for new chat
            const query = prompt('Search for user to start chat:');
            if (query) {
              // Will be handled by search component
            }
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <span>✏️</span> New Chat
        </button>
      </div>

      {/* Menu Sidebar */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-0 h-screen w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 border-r dark:border-gray-700 overflow-y-auto"
          >
            <TelegramMenu user={user} onClose={() => setShowMenu(false)} onLogout={onLogout} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMenu(false)}
          className="fixed inset-0 bg-black/20 z-40"
        />
      )}
    </div>
  );
};

export default TelegramSidebar;
