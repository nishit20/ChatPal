import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import SidebarMenu from './SidebarMenu';
import SettingsPanel from './SettingsPanel';
import NewGroupModal from './NewGroupModal';
import AddFriendsModal from './AddFriendsModal';
import ContactsModal from './ContactsModal';
import SavedMessagesView from './SavedMessagesView';
import ChatList from './ChatList';
import UserSearch from './UserSearch';

const EnhancedSidebar = ({ chats, activeChat, onOpenChat, onNewChat, onLogout, user }) => {
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showSavedMessages, setShowSavedMessages] = useState(false);
  const [filteredChats, setFilteredChats] = useState(chats);

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

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'settings':
        setShowSettings(true);
        break;
      case 'newgroup':
        setShowNewGroup(true);
        break;
      case 'addfriends':
        setShowAddFriends(true);
        break;
      case 'contacts':
        setShowContacts(true);
        break;
      case 'saved':
        setShowSavedMessages(true);
        break;
      default:
        break;
    }
  };

  // Handler to add new group to chats
  const handleCreateGroup = (newGroup) => {
    setShowNewGroup(false);
    if (newGroup) {
      // Add the new group to the filteredChats and chats props if not already present
      if (!chats.some(c => c.id === newGroup.id)) {
        if (typeof onNewChat === 'function') {
          onNewChat(newGroup);
        }
      }
    }
  };

  return (
    <div className="w-96 flex flex-col h-screen" style={{ 
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)'
    }}>
      {/* Header */}
      <div className="p-4 border-b space-y-4" style={{ 
        backgroundColor: 'var(--bg-main)',
        borderColor: 'var(--border-color)'
      }}>
        {/* Top Bar with Logo, Menu & Search */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg transition hover:bg-[#f1f5fa] text-[#23272f]"
            title="Menu"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 15a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ChatPal
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg transition hover:bg-[#f1f5fa] text-[#23272f]"
            title="Settings"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* User Search - Telegram-style */}
        <div className="mt-2">
          <UserSearch onSelectUser={(selectedUser) => {
            if (onNewChat) {
              onNewChat(selectedUser);
            }
          }} />
        </div>
        
        {/* Chat Search Bar (for filtering existing chats) */}
        {chats.length > 0 && (
          <div className="mt-2 flex items-center rounded-full px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent ml-3 outline-none text-sm"
              style={{ 
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? 'No chats found' : 'No chats yet. Start a new conversation!'}
          </div>
        ) : (
          <ChatList 
            chats={filteredChats} 
            onOpenChat={(chat) => {
              if (typeof chat === 'object') {
                onOpenChat(chat);
              } else {
                const foundChat = filteredChats.find(c => (c.id === chat || c._id === chat));
                if (foundChat) onOpenChat(foundChat);
              }
            }}
            activeChat={activeChat}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className={`p-4 space-y-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewGroup(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <span>👥</span> New Group
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddFriends(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <span>➕</span> Add Friends
        </motion.button>
      </div>

      {/* Menu Sidebar */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`fixed left-0 top-0 h-screen w-80 ${
              theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } shadow-2xl z-50 border-r overflow-y-auto`}
          >
            <SidebarMenu
              user={user}
              onClose={() => setShowMenu(false)}
              onLogout={onLogout}
              onAction={handleMenuAction}
              theme={theme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMenu(false)}
            className="fixed inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed inset-0 ${
              theme === 'dark' ? 'bg-black/50' : 'bg-black/30'
            } z-50 flex items-center justify-center p-4`}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <SettingsPanel onClose={() => setShowSettings(false)} user={user} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Group Modal */}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Add Friends Modal */}
      <AnimatePresence>
        {showAddFriends && (
          <AddFriendsModal
            onClose={() => setShowAddFriends(false)}
          />
        )}
      </AnimatePresence>

      {/* Contacts Modal */}
      <AnimatePresence>
        {showContacts && (
          <ContactsModal
            onClose={() => setShowContacts(false)}
            onSelectContact={(contact) => {
              onOpenChat(contact.id);
              setShowContacts(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Saved Messages View */}
      <AnimatePresence>
        {showSavedMessages && (
          <SavedMessagesView
            onClose={() => setShowSavedMessages(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSidebar;
