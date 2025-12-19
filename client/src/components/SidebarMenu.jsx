import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const SidebarMenu = ({ user, onClose, onLogout, onAction, theme }) => {
  const { toggle } = useContext(ThemeContext);
  const menuItems = [
    { 
      icon: '👤', 
      label: 'My Profile', 
      action: () => {
        onAction('profile');
        onClose();
      } 
    },
    { 
      icon: '👥', 
      label: 'New Group', 
      action: () => {
        onAction('newgroup');
        onClose();
      } 
    },
    { 
      icon: '📢', 
      label: 'New Channel', 
      action: () => {
        onAction('newchannel');
        onClose();
      } 
    },
    { 
      icon: '📇', 
      label: 'Contacts', 
      action: () => {
        onAction('contacts');
        onClose();
      } 
    },
    { 
      icon: '☎️', 
      label: 'Calls', 
      action: () => {
        onAction('calls');
        onClose();
      } 
    },
    { 
      icon: '⭐', 
      label: 'Saved Messages', 
      action: () => {
        onAction('saved');
        onClose();
      } 
    },
    { 
      icon: '➕', 
      label: 'Add Friends', 
      action: () => {
        onAction('addfriends');
        onClose();
      } 
    },
    { 
      icon: '⚙️', 
      label: 'Settings', 
      action: () => {
        onAction('settings');
        onClose();
      } 
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with User Info */}
      <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition ${
            theme === 'dark'
              ? 'hover:bg-gray-800 text-white'
              : 'hover:bg-gray-100 text-gray-900'
          }`}
        >
          ✕
        </button>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-4 mt-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 animate-avatar shadow-lg">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user?.name}
                className="w-16 h-16 rounded-full object-cover animate-avatar"
              />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
              {user?.name}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
              @{user?.username}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              {user?.phoneNumber || user?.email}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Menu Items with Dividers */}
      <div className="flex-1 py-2 space-y-1 bg-white">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            onClick={item.action}
            whileHover={{
              scale: 1.04,
              backgroundColor: '#e9f0fb',
              boxShadow: '0 4px 24px 0 rgba(60, 80, 180, 0.08)',
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 flex items-center gap-4 transition text-left rounded-xl bg-white text-[#23272f] font-medium shadow-sm border border-[#e3e9f7] hover:bg-[#e9f0fb] focus:bg-[#e3e9f7] focus:outline-none"
          >
            <span className="text-2xl w-8 flex items-center justify-center text-[#5A8DEE]">{item.icon}</span>
            <span className="font-medium text-base">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Divider */}
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

      {/* Settings Section */}
      <div className={`p-6 space-y-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Theme Toggle */}
        <motion.div
          whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(0, 0, 0, 0.03)' }}
          className={`flex items-center justify-between px-4 py-3 rounded-lg transition cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-gray-800'
              : 'hover:bg-gray-50'
          }`}
          onClick={toggle}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🌙</span>
            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Night Mode
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full transition ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
          } flex items-center`}>
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          onClick={() => {
            console.log('Logout button clicked', { onLogout, onClose });
            if (typeof onLogout === 'function') {
              onLogout();
              if (typeof onClose === 'function') {
                onClose();
              }
            } else {
              console.error('onLogout is not a function:', onLogout);
            }
          }}
          whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'text-red-400 hover:bg-red-900/30'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          🚪 Logout
        </motion.button>
      </div>

      {/* Footer */}
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 text-center text-xs ${
        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
      }`}>
        <p>ChatPal v2.0.0</p>
        <p className="mt-1">© 2025 - Made with ❤️</p>
      </div>
    </div>
  );
};

export default SidebarMenu;
