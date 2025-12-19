import React, { createContext, useState, useEffect } from 'react';
import apiWrapper from '../services/api';
import { disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('chat_auth');
    if (raw) {
      const data = JSON.parse(raw);
      setUser(data.user);
      setToken(data.token);
      apiWrapper.setToken(data.token);
    }
  }, []);

  const login = ({ token, user }) => {
    setUser(user);
    setToken(token);
    apiWrapper.setToken(token);
    localStorage.setItem('chat_auth', JSON.stringify({ token, user }));
  };

  const logout = () => {
    console.log('logout() called in AuthContext');
    disconnectSocket();
    console.log('Socket disconnected');
    setUser(null);
    setToken(null);
    apiWrapper.setToken(null);
    localStorage.removeItem('chat_auth');
    localStorage.removeItem('theme');
    console.log('✓ Logout successful - user cleared from state');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
