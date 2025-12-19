import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function Header(){
  const { user } = useContext(AuthContext);
  const { theme, toggle } = useContext(ThemeContext);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-800">
      <div className="flex items-center">
        <img src={user?.profilePicture || 'https://placehold.co/48'} alt="me" className="w-10 h-10 rounded-full mr-3" />
        <div>
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user?.name || 'You'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={toggle} title="Toggle theme" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          {theme === 'light' ? '🌞' : '🌙'}
        </button>
      </div>
    </div>
  );
}
