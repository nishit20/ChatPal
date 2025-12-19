import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageActions } from './MessageActions';
import VoiceMessage from './VoiceMessage';

const Message = ({ msg, currentUserId, onReply, onEdit, onDelete, onReact, onStar, isSameUser, index }) => {
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');
  const isOwnMessage = msg.from === currentUserId;

  useEffect(() => {
    const handleCompactModeChange = (e) => {
      setCompactMode(e.detail);
    };
    
    window.addEventListener('compactModeChanged', handleCompactModeChange);
    return () => window.removeEventListener('compactModeChanged', handleCompactModeChange);
  }, []);

  // Determine message status icon
  const getStatusIcon = () => {
    if (!isOwnMessage) return null;
    if (msg.readBy?.length > 0) return '✓✓'; // Read
    if (msg.delivered) return '✓✓'; // Delivered
    return '✓'; // Sent
  };

  // Format timestamp
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      key={msg._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.02,
        duration: 0.2,
        ease: "easeOut"
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`flex gap-2 ${isSameUser ? 'mt-0.5' : 'mt-3'} ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && !isSameUser && (
        <div className="avatar flex-shrink-0" style={{ 
          background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`,
          width: compactMode ? '32px' : '40px',
          height: compactMode ? '32px' : '40px',
          fontSize: compactMode ? '14px' : '16px'
        }}>
          {msg.fromUser?.name?.[0] || '?'}
        </div>
      )}
      {!isOwnMessage && isSameUser && <div className={`flex-shrink-0 ${compactMode ? 'w-6' : 'w-8'}`} />}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {!isOwnMessage && !isSameUser && (
          <span className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            {msg.fromUser?.name}
          </span>
        )}

        {/* Message Bubble */}
        <div className={`relative group break-words ${
          isOwnMessage
            ? 'message-bubble-sent'
            : 'message-bubble-received'
        } ${isSameUser ? 'message-grouped' : ''}`}>
          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`text-xs mb-2 p-2 rounded border-l-3 ${
              isOwnMessage
                ? 'bg-white/20 border-white/40'
                : 'bg-gray-100 border-gray-300'
            }`} style={!isOwnMessage ? { 
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            } : {}}>
              <div className="font-semibold">{msg.replyTo.fromUser?.name || 'Unknown'}</div>
              <div className="truncate">{msg.replyTo.content}</div>
            </div>
          )}

          {/* Media display */}
          {msg.type === 'image' && msg.content && (
            <img
              src={msg.content}
              alt="message"
              className="rounded max-w-xs max-h-64 mb-2"
            />
          )}
          {msg.type === 'voice' && msg.content && (
            <VoiceMessage
              url={msg.content}
              duration={msg.duration || 0}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}
          {msg.type === 'file' && msg.content && (
            <a
              href={msg.content}
              target="_blank"
              rel="noopener noreferrer"
              className="underline flex items-center gap-2"
            >
              📎 {msg.fileName || 'Download file'}
            </a>
          )}

          {/* Text content */}
          {(msg.type === 'text' || (msg.type === 'image' && msg.content?.caption)) && (
            <p className="text-sm leading-relaxed">{msg.type === 'text' ? msg.content : msg.content?.caption}</p>
          )}

          {/* Edit indicator */}
          {msg.edited && (
            <span className="text-xs opacity-70 ml-2">(edited)</span>
          )}

          {/* Reactions display */}
          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(msg.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  className="text-xs bg-white dark:bg-gray-800 rounded-full px-2 py-1 hover:scale-110 transition"
                  title={`${count} ${emoji}`}
                >
                  {emoji} {count > 1 ? count : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message meta (time + status) */}
        <div className="flex items-center gap-1 mt-1 text-xs" style={{ 
          color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-secondary)' 
        }}>
          {isOwnMessage && (
            <span style={{ opacity: 0.8 }}>
              {getStatusIcon()}
            </span>
          )}
          <span>
            {formatTime(msg.createdAt)}
          </span>
        </div>
      </div>

      {/* Action buttons on hover */}
      {showActions && (
        <MessageActions
          message={{ ...msg, isOwnMessage }}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onReact={onReact}
          onStar={onStar}
          isStarred={msg.starred}
        />
      )}
    </motion.div>
  );
};

export default Message;
