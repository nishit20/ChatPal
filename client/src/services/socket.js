import { io } from 'socket.io-client';

let socket = null;

// Use explicit backend URL when available (Vite env) or fall back to localhost:5000 for dev.
const getBackendUrl = () => {
  try {
    // Vite exposes env vars as import.meta.env
    // VITE_API_URL can be set to 'http://localhost:5000' in dev
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  } catch (e) {
    return 'http://localhost:5000';
  }
};

export const connectSocket = (token) => {
  const backend = getBackendUrl();
  socket = io(backend, {
    auth: { token },
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => console.info('Socket connected', socket.id));
  socket.on('connect_error', (err) => console.warn('Socket connect_error', err));
  socket.on('reconnect_attempt', (n) => console.info('Socket reconnect attempt', n));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => { if (socket) socket.disconnect(); socket = null; };
