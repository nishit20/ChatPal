import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import OnlineIndicator from './OnlineIndicator';
import MessageSearch from './MessageSearch';
import StarredMessages from './StarredMessages';
import ForwardMessage from './ForwardMessage';
import CallButton from './CallButton';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { AuthContext } from '../context/AuthContext';
import { CallContext } from '../context/CallContext';

export default function ChatWindow({ chat, user }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const { token } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id || null;

  useEffect(() => {
    if (!chat) return setMessages([]);

    const fetchMessages = async () => {
      try {
        const response = await api.instance.get(`/chats/${chat._id}/messages`);
        // Backend returns { success, data: [...] } for this endpoint
        const payload = response?.data;
        const list = Array.isArray(payload) ? payload : (payload?.data || payload?.messages || []);
        const msgs = Array.isArray(list) ? list : [];
        setMessages(msgs);

        // Mark unread messages as read when opening the chat
        const socket = getSocket();
        if (socket && currentUserId) {
          const myId = String(currentUserId);
          msgs.forEach((m) => {
            const fromId = typeof m.from === 'object' ? (m.from?._id || m.from?.id) : m.from;
            const senderId = fromId ? String(fromId) : null;
            const readBy = (m.readBy || []).map((x) => String(typeof x === 'object' ? (x._id || x.id) : x));
            if (senderId && senderId !== myId && !readBy.includes(myId)) {
              socket.emit('message_read', { messageId: m._id, userId: myId });
            }
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const socket = getSocket();
    if (socket) {
      socket.emit('join_chat', { chatId: chat._id });

      socket.on('receive_message', (msg) => {
        if (msg.chat === chat._id) {
          setMessages((prev) => {
            // Replace pending message if content/type matches, else just add
            const idx = prev.findIndex(
              (m) => m.pending && m.content === msg.content && m.type === msg.type
            );
            if (idx !== -1) {
              // Replace the pending message with the real one
              return [
                ...prev.slice(0, idx),
                msg,
                ...prev.slice(idx + 1),
              ];
            } else {
              return [...prev, msg];
            }
          });

          // Immediately mark incoming message as read if we're viewing this chat
          if (currentUserId) {
            const fromId = typeof msg.from === 'object' ? (msg.from?._id || msg.from?.id) : msg.from;
            if (fromId && String(fromId) !== String(currentUserId)) {
              socket.emit('message_read', { messageId: msg._id, userId: String(currentUserId) });
            }
          }
        }
      });

      socket.on('user_typing', ({ from, chatId }) => {
        if (chatId === chat._id && from !== currentUserId) {
          setTypingUsers((prev) => {
            if (!prev.includes(from)) return [...prev, from];
            return prev;
          });
        }
      });

      socket.on('user_stop_typing', ({ from, chatId }) => {
        if (chatId === chat._id) {
          setTypingUsers((prev) => prev.filter((u) => u !== from));
        }
      });

      socket.on('message_delivered', ({ messageId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, delivered: true } : msg
          )
        );
      });

      socket.on('message_read', ({ messageId, userId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  readBy: Array.from(
                    new Set([
                      ...((msg.readBy || []).map((x) => String(typeof x === 'object' ? (x._id || x.id) : x))),
                      ...(userId ? [String(userId)] : []),
                    ])
                  ),
                }
              : msg
          )
        );
      });

      return () => {
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('message_delivered');
        socket.off('message_read');
      };
    }
  }, [chat, currentUserId]);

  const handleSend = async ({ content, type = 'text', formData }) => {
    const socket = getSocket();
    if (!socket) return;

    let fileUrl = null;
    let duration = null;

    if (formData) {
      try {
        const uploadResponse = await api.instance.post('/upload', formData);
        fileUrl = uploadResponse.data.url;
        duration = uploadResponse.data.duration; // For voice messages
      } catch (error) {
        console.error('Upload error:', error);
        return;
      }
    }

    const other = chat.members.find(
      (m) => (m._id || m.id) !== currentUserId
    );

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      chat: chat._id,
      from: currentUserId,
      to: other?._id || other?.id,
      content: fileUrl || content,
      type,
      duration,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const payload = {
      chatId: chat._id,
      from: currentUserId,
      to: other?._id || other?.id,
      content: fileUrl || content,
      type,
      duration,
    };

    socket.emit('send_message', payload);
  };

  const handleStar = async (message) => {
    try {
      await api.instance.post(`/chats/${chat._id}/star`, {
        messageId: message._id,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === message._id ? { ...msg, starred: !msg.starred } : msg
        )
      );
    } catch (error) {
      console.error('Error starring message:', error);
    }
  };

  const handleForward = (message) => {
    setForwardMessage(message);
  };

  const otherUser = chat?.members?.find(
    (m) => (m._id || m.id) !== currentUserId
  );

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-chat)' }}>
        <div className="text-center">
          <div className="text-8xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Select a chat to start messaging</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Choose a conversation from the left or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <div className="h-16 border-b px-6 py-3 flex items-center justify-between" style={{ 
        backgroundColor: 'var(--bg-main)',
        borderColor: 'var(--border-color)'
      }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="avatar avatar-online" style={{ 
              background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})` 
            }}>
              {chat.isGroup ? chat.name?.[0] : otherUser?.name?.[0]}
            </div>
            {!chat.isGroup && otherUser?.onlineStatus && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full" style={{ 
                backgroundColor: 'var(--online-indicator)',
                border: '2px solid var(--bg-main)'
              }} />
            )}
          </div>
          <div>
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {chat.isGroup ? chat.name : otherUser?.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {chat.isGroup
                ? `${chat.members?.length || 0} members`
                : otherUser?.onlineStatus
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg transition"
            style={{ 
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            title="Search messages"
          >
            🔍
          </button>
          <button
            onClick={() => setShowStarred(true)}
            className="p-2 rounded-lg transition"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            title="Starred messages"
          >
            ⭐
          </button>
          {!chat.isGroup && otherUser && (
            <>
              <CallButton user={otherUser} callType="audio" />
              <CallButton user={otherUser} callType="video" />
            </>
          )}
          <button 
            className="p-2 rounded-lg transition"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 relative" style={{ backgroundColor: 'var(--bg-chat)' }}>
        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <MessageSearch
              chatId={chat._id}
              onSelectMessage={(msg) => {
                // Scroll to message or highlight it
                setShowSearch(false);
              }}
              onClose={() => setShowSearch(false)}
            />
          )}
        </AnimatePresence>

        <div className="py-4 max-w-content mx-auto">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            onStar={handleStar}
            onForward={handleForward}
          />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="px-6 pt-2 pb-0"
        >
          <TypingIndicator users={typingUsers} />
        </motion.div>
      )}

      {/* Message Input */}
      <MessageInput onSend={handleSend} chatId={chat._id} disabled={false} />

      {/* Modals */}
      <AnimatePresence>
        {showStarred && (
          <StarredMessages
            chatId={chat._id}
            onSelectMessage={(msg) => {
              // Handle selection
            }}
            onClose={() => setShowStarred(false)}
          />
        )}
        {forwardMessage && (
          <ForwardMessage
            message={forwardMessage}
            user={user}
            onClose={() => setForwardMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
