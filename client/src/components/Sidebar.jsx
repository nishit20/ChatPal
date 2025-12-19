import React, { useState, useContext } from 'react';
import ChatList from './ChatList';
import UserSearch from './UserSearch';
import NewGroupModal from './NewGroupModal';
import { AuthContext } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import OnlineIndicator from './OnlineIndicator';

export default function Sidebar({ chats, onOpenChat, onNewChat }) {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('chats');
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleSelectUser = (selectedUser) => {
    // Create or open direct chat with user
    onNewChat(selectedUser);
  };

  const handleGroupCreated = (group) => {
    // Add new group to chat list
    onNewChat(group);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* User Profile & Actions */}
      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]}
              </div>
              <div className="absolute bottom-0 right-0">
                <OnlineIndicator isOnline={user?.onlineStatus} />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGroupModal(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition text-lg"
            title="New group"
          >
            ➕
          </button>
        </div>

        {/* User Search */}
        <UserSearch onSelectUser={handleSelectUser} />
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 bg-white dark:bg-gray-850">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 py-3 text-center font-medium transition border-b-2 ${
            tab === 'chats'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          💬 Chats
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 py-3 text-center font-medium transition border-b-2 ${
            tab === 'contacts'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          👥 Contacts
        </button>
      </div>

      {/* Chat List or Contacts */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' ? (
          <ChatList chats={chats} onOpenChat={onOpenChat} />
        ) : (
          <div className="p-2 text-gray-500 dark:text-gray-400 text-sm">
            Contacts feature coming soon
          </div>
        )}
      </div>

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
