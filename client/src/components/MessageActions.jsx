import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

export const MessageActions = ({ message, onReply, onEdit, onDelete, onReact, onStar, isStarred, onForward }) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
      {/* Reactions Button */}
      <div ref={reactionsRef} className="relative">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          title="Add reaction"
        >
          😊
        </button>
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1"
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setShowReactions(false);
                  }}
                  className="text-xl hover:scale-125 transition"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reply Button */}
      <button
        onClick={() => onReply(message)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
        title="Reply"
      >
        ↩️
      </button>

      {/* Edit Button (only if user is author) */}
      {message.isOwnMessage && (
        <button
          onClick={() => onEdit(message)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          title="Edit"
        >
          ✏️
        </button>
      )}

      {/* Delete Button (only if user is author) */}
      {message.isOwnMessage && (
        <button
          onClick={() => onDelete(message)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition text-red-600 dark:text-red-400"
          title="Delete"
        >
          🗑️
        </button>
      )}

      {/* Forward Button */}
      <button
        onClick={() => onForward?.(message)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
        title="Forward"
      >
        ↗️
      </button>

      {/* Star Button */}
      <button
        onClick={() => onStar?.(message)}
        className={`p-2 rounded transition ${
          isStarred
            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-500'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={isStarred ? 'Unstar' : 'Star'}
      >
        {isStarred ? '⭐' : '☆'}
      </button>
    </div>
  );
};
