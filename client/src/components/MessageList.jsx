import React, { useState, useEffect } from 'react';
import Message from './Message';
import { getSocket } from '../services/socket';

export default function MessageList({ messages = [], currentUserId, onStar, onForward }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');

  useEffect(() => {
    const handleCompactModeChange = (e) => {
      setCompactMode(e.detail);
    };
    
    window.addEventListener('compactModeChanged', handleCompactModeChange);
    return () => window.removeEventListener('compactModeChanged', handleCompactModeChange);
  }, []);

  const handleReply = (msg) => {
    setReplyingTo(msg);
    const socket = getSocket();
    if (socket) socket.emit('reply_message', { messageId: msg._id, chatId: msg.chat });
  };

  const handleEdit = (msg) => {
    setEditingId(msg._id);
    const socket = getSocket();
    if (socket) socket.emit('edit_message', { messageId: msg._id, chatId: msg.chat });
  };

  const handleDelete = (msg) => {
    if (window.confirm('Delete this message?')) {
      const socket = getSocket();
      if (socket) {
        socket.emit('delete_message', { messageId: msg._id, chatId: msg.chat });
      }
      console.info('Message deleted', msg._id);
    }
  };

  const handleReact = (msg, emoji) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('react_message', { messageId: msg._id, chatId: msg.chat, reaction: emoji });
      console.info('Reaction added:', emoji);
    }
  };

  return (
    <div className={`space-y-2 overflow-y-auto flex-1 p-4 stagger-children ${compactMode ? 'compact-mode' : ''}`}>
      {replyingTo && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 mb-4 rounded flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Replying to</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-blue-500 hover:text-blue-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isSameUser = prevMsg && prevMsg.from === msg.from;

        return (
          <Message
            key={msg._id}
            msg={msg}
            index={index}
            currentUserId={currentUserId}
            isSameUser={isSameUser}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={(emoji) => handleReact(msg, emoji)}
            onStar={onStar}
            onForward={onForward}
          />
        );
      })}
    </div>
  );
}
