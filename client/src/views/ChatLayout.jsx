import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { connectSocket, getSocket } from '../services/socket';
import api from '../services/api';
import EnhancedSidebar from '../components/EnhancedSidebar';
import ChatWindow from '../components/ChatWindow';

export default function ChatLayout() {
  const { user, token, logout } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const currentUserId = user?._id || user?.id || null;

  const activeChatIdRef = useRef(null);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    activeChatIdRef.current = activeChat?._id || activeChat?.id || null;
  }, [activeChat]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId ? String(currentUserId) : null;
  }, [currentUserId]);

  useEffect(() => {
    if (token) connectSocket(token);

    const fetchChats = async () => {
      try {
        const response = await api.instance.get('/chats');
        // Backend returns { success, data: [...] } for this endpoint
        const payload = response?.data;
        const list = Array.isArray(payload) ? payload : (payload?.data || payload?.chats || []);
        setChats(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();

    const socket = getSocket();
    if (socket) {
      socket.on('receive_message', (msg) => {
        const chatId = String(msg.chat);
        const activeId = activeChatIdRef.current ? String(activeChatIdRef.current) : null;
        const isActive = activeId && activeId === chatId;
        const fromId = typeof msg.from === 'object' ? (msg.from?._id || msg.from?.id) : msg.from;
        const isFromMe = currentUserIdRef.current && String(fromId) === currentUserIdRef.current;
        setChats((prev) =>
          prev.map((c) =>
            String(c._id) === chatId
              ? {
                  ...c,
                  lastMessage: msg.content,
                  updatedAt: new Date(),
                  // If message is for an inactive chat, bump unreadCount
                  unreadCount: isActive
                    ? 0
                    : (isFromMe ? (c.unreadCount || 0) : ((c.unreadCount || 0) + 1)),
                }
              : c
          )
        );
      });

      socket.on('user_online', ({ userId }) => {
        setChats((prev) =>
          prev.map((c) => ({
            ...c,
            members: c.members.map((m) =>
              (m._id === userId || m.id === userId)
                ? { ...m, onlineStatus: true }
                : m
            ),
          }))
        );
      });

      socket.on('user_offline', ({ userId }) => {
        setChats((prev) =>
          prev.map((c) => ({
            ...c,
            members: c.members.map((m) =>
              (m._id === userId || m.id === userId)
                ? { ...m, onlineStatus: false, lastSeen: new Date() }
                : m
            ),
          }))
        );
      });

      return () => {
        socket.off('receive_message');
        socket.off('user_online');
        socket.off('user_offline');
      };
    }
  }, [token]);

  const handleOpenChat = (chat) => {
    setActiveChat(chat);
    const chatId = chat?._id || chat?.id;
    if (chatId) {
      setChats((prev) =>
        prev.map((c) => (String(c._id) === String(chatId) ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  // Add new chat/group to chats state
  const handleNewChat = async (newChatOrUser) => {
    try {
      // If it's a user object (from search), create or get chat
      if (newChatOrUser.userId || newChatOrUser._id) {
        const userId = newChatOrUser.userId || newChatOrUser._id;
        
        // Call createOrGet chat API
        const response = await api.instance.post('/chats/createOrGet', { userId });
        
        if (response.data.success) {
          const chat = response.data.chat;
          
          // Update chats list
          setChats((prev) => {
            const existing = prev.find((c) => c._id === chat._id || c.id === chat._id);
            if (!existing) {
              return [chat, ...prev];
            }
            return prev;
          });
          
          // Open the chat
          setActiveChat(chat);
        }
      } else {
        // It's already a chat object (e.g., from group creation)
        setChats((prev) => {
          const chatId = newChatOrUser.id || newChatOrUser._id;
          if (!prev.some((c) => (c.id === chatId || c._id === chatId))) {
            return [newChatOrUser, ...prev];
          }
          return prev;
        });
        setActiveChat(newChatOrUser);
      }
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      alert(error.response?.data?.message || 'Failed to open chat');
    }
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
        {/* Left Menu & Sidebar */}
        <EnhancedSidebar
          user={user}
          chats={chats}
          activeChat={activeChat}
          onOpenChat={handleOpenChat}
          onNewChat={handleNewChat}
          onLogout={logout}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
          <ChatWindow chat={activeChat} user={user} />
        </div>
      </div>
    </ThemeProvider>
  );
}
