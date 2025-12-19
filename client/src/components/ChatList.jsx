import React, { useState, useEffect } from 'react';

export default function ChatList({ chats = [], onOpenChat, activeChat }){
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');

  useEffect(() => {
    const handleCompactModeChange = (e) => {
      setCompactMode(e.detail);
    };
    
    window.addEventListener('compactModeChanged', handleCompactModeChange);
    return () => window.removeEventListener('compactModeChanged', handleCompactModeChange);
  }, []);
  return (
    <div className={`space-y-0.5 ${compactMode ? 'compact-mode' : ''}`}>
      {chats.map(c => {
        const last = c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const title = c.isGroup ? c.name : (c.members && c.members.find(m=>true) ? c.members.find(m=>true).name : 'Chat');
        const isActive = activeChat?._id === c._id;
        return (
          <div 
            key={c._id} 
            className={`sidebar-item flex items-center cursor-pointer ${isActive ? 'active' : ''}`}
            onClick={()=>onOpenChat(c)}
          >
            <div className="avatar mr-3 flex-shrink-0" style={{ 
              background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)})`,
              width: compactMode ? '36px' : '48px',
              height: compactMode ? '36px' : '48px',
              fontSize: compactMode ? '14px' : '16px'
            }}>
              {title?.slice(0,2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{title}</div>
                <div className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>{last}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.lastMessage || 'No messages yet'}</div>
                {c.unreadCount > 0 && (
                  <div className="badge ml-2 flex-shrink-0">{c.unreadCount}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
