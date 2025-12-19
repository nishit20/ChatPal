import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';

const TelegramMenu = ({ user, onClose, onLogout }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const menuItems = [
    { icon: '👤', label: 'My Profile', action: () => console.log('Profile') },
    { icon: '👥', label: 'New Group', action: () => console.log('New Group') },
    { icon: '📢', label: 'New Channel', action: () => console.log('New Channel') },
    { icon: '📇', label: 'Contacts', action: () => console.log('Contacts') },
    { icon: '☎️', label: 'Calls', action: () => console.log('Calls') },
    { icon: '⭐', label: 'Saved Messages', action: () => console.log('Saved') },
    { icon: '⚙️', label: 'Settings', action: () => console.log('Settings') },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          ✕
        </button>
        <div className="flex items-center gap-4 mt-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{user?.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4 space-y-0">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            onClick={item.action}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            className="w-full px-6 py-4 flex items-center gap-4 dark:hover:bg-gray-800 transition text-left dark:text-white"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="border-t dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between px-2 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🌙</span>
            <span className="font-medium dark:text-white">Night Mode</span>
          </div>
          <button
            onClick={() => toggleTheme()}
            className={`w-12 h-6 rounded-full transition ${
              theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
            } flex items-center`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={onLogout}
          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          className="w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          🚪 Logout
        </motion.button>
      </div>

      {/* Footer */}
      <div className="border-t dark:border-gray-700 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Telegram Clone v1.0.0</p>
        <p className="mt-1">© 2025 - Made with ❤️</p>
      </div>
    </div>
  );
};

export default TelegramMenu;
