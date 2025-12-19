require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const searchRoutes = require('./routes/search');
const callRoutes = require('./routes/calls');

const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Call = require('./models/Call');

const app = express();
const server = http.createServer(app);

// CORS configuration for production - ALLOW ALL for debugging
app.use(cors());
// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body).substring(0, 100) : '');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve locally stored uploads (dev fallback when Cloudinary isn't configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ChatPal Backend API', status: 'running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ChatPal API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      contacts: '/api/contacts',
      chats: '/api/chats',
      messages: '/api/messages',
      groups: '/api/groups',
      upload: '/api/upload',
      ai: '/api/ai',
      search: '/api/search'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/calls', callRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}`
  });
});

// Global error handler middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err.message);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Debug: Log registered upload routes
console.log('📋 Upload routes registered:');
console.log('  POST /api/upload/profile-picture');
console.log('  POST /api/upload/');
console.log('  GET  /api/upload/test');

// MongoDB connection setup
let dbConnected = false;
const initDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (MONGO_URI && MONGO_URI.trim()) {
      // Use MongoDB Atlas (cloud) if URI is provided
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      dbConnected = true;
      console.log('✅ MongoDB Atlas connected');
    } else {
      // Use in-memory MongoDB for development (default)
      console.log('Starting in-memory MongoDB for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      
      // Create in-memory server with timeout
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          port: undefined, // Use random port
        },
      });
      
      const mongoUri = mongoServer.getUri();
      console.log('MongoDB URI created, connecting...');
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      dbConnected = true;
      console.log('✅ In-memory MongoDB connected (development mode)');
      console.log('⚠️  NOTE: Data will be lost if the server restarts!');
      console.log('💡 To persist data, set MONGO_URI env var with MongoDB Atlas connection string');
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('Full error:', err);
    console.warn('⚠️ WARNING: Running without persistent database. Restart to reset data.');
    // Continue running anyway - the app will work with Mongoose stubs
  }
};

const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false
  } 
});

// Export io instance for use in controllers
const socketService = require('./services/socket');
socketService.setIO(io);

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const p = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.user = p;
  } catch (err) { /* ignore */ }
  next();
});

io.on('connection', async (socket) => {
  console.log('socket connected', socket.id, socket.user?.id);
  if (socket.user?.id) {
    const u = socket.user.id;
    const arr = onlineUsers.get(u) || [];
    arr.push(socket.id);
    onlineUsers.set(u, arr);
    
    // Update user online status in database
    await User.findByIdAndUpdate(u, { 
      isOnline: true, 
      lastSeen: new Date() 
    }).catch(err => console.error('Error updating online status:', err));
    
    io.emit('user_online', { userId: u });
  }

  socket.on('join_chat', ({ chatId }) => { socket.join(chatId); });

  socket.on('send_message', async (payload) => {
    try {
      const msg = new Message({
        chat: payload.chatId,
        from: payload.from,
        to: payload.to,
        type: payload.type || 'text',
        content: payload.content,
        replyTo: payload.replyTo || null,
      });
      await msg.save();
      await Chat.findByIdAndUpdate(payload.chatId, { $push: { messages: msg._id }, lastMessage: msg.content, updatedAt: new Date() });
      io.to(payload.chatId).emit('receive_message', msg);
      if (payload.to) {
        const sockets = onlineUsers.get(payload.to.toString()) || [];
        sockets.forEach(sid => io.to(sid).emit('message_delivered', { messageId: msg._id }));
      }
    } catch (err) { console.error('send_message error', err); }
  });

  socket.on('typing', ({ chatId, from }) => { socket.to(chatId).emit('user_typing', { chatId, from }); });
  socket.on('stop_typing', ({ chatId, from }) => { socket.to(chatId).emit('user_stop_typing', { chatId, from }); });

  socket.on('message_read', async ({ messageId, userId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } });
      io.emit('message_read', { messageId, userId });
    } catch (err) { console.error(err); }
  });

  socket.on('react_message', async ({ messageId, chatId, reaction }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[reaction] = (msg.reactions[reaction] || 0) + 1;
      await msg.save();
      io.to(chatId).emit('message_reacted', { messageId, reaction, count: msg.reactions[reaction] });
    } catch (err) { console.error('react error', err); }
  });

  socket.on('edit_message', async ({ messageId, chatId, content }) => {
    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { content, edited: true, updatedAt: new Date() },
        { new: true }
      );
      io.to(chatId).emit('message_edited', msg);
    } catch (err) { console.error('edit error', err); }
  });

  socket.on('delete_message', async ({ messageId, chatId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { deleted: true, content: '[deleted]' });
      io.to(chatId).emit('message_deleted', { messageId });
    } catch (err) { console.error('delete error', err); }
  });

  // ==================== CALL EVENTS ====================
  socket.on('initiate_call', async ({ callerId, recipientId, callType }) => {
    try {
      const recipientSockets = onlineUsers.get(recipientId) || [];
      const callData = {
        callId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        callerId,
        recipientId,
        callType, // 'audio' or 'video'
        initiatedAt: new Date(),
      };
      
      // Send incoming call to recipient
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('incoming_call', callData);
      });
    } catch (err) { console.error('initiate_call error', err); }
  });

  socket.on('accept_call', ({ callId, callerId, recipientId }) => {
    try {
      const callerSockets = onlineUsers.get(callerId) || [];
      callerSockets.forEach(socketId => {
        io.to(socketId).emit('call_accepted', { callId, recipientId });
      });
    } catch (err) { console.error('accept_call error', err); }
  });

  socket.on('decline_call', ({ callId, callerId, recipientId }) => {
    try {
      const callerSockets = onlineUsers.get(callerId) || [];
      callerSockets.forEach(socketId => {
        io.to(socketId).emit('call_declined', { callId, recipientId });
      });
    } catch (err) { console.error('decline_call error', err); }
  });

  socket.on('end_call', ({ callId, callerId, recipientId, duration }) => {
    try {
      const recipientSockets = onlineUsers.get(recipientId) || [];
      const callerSockets = onlineUsers.get(callerId) || [];
      
      const callEndData = { callId, duration };
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('call_ended', callEndData);
      });
      callerSockets.forEach(socketId => {
        io.to(socketId).emit('call_ended', callEndData);
      });
    } catch (err) { console.error('end_call error', err); }
  });

  // WebRTC signaling
  socket.on('send_offer', ({ to, offer }) => {
    try {
      const recipientSockets = onlineUsers.get(to) || [];
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('receive_offer', { from: socket.user?.id, offer });
      });
    } catch (err) { console.error('send_offer error', err); }
  });

  socket.on('send_answer', ({ to, answer }) => {
    try {
      const recipientSockets = onlineUsers.get(to) || [];
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('receive_answer', { from: socket.user?.id, answer });
      });
    } catch (err) { console.error('send_answer error', err); }
  });

  socket.on('send_ice_candidate', ({ to, candidate }) => {
    try {
      const recipientSockets = onlineUsers.get(to) || [];
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('receive_ice_candidate', { from: socket.user?.id, candidate });
      });
    } catch (err) { console.error('send_ice_candidate error', err); }
  });

  socket.on('disconnect', async () => {
    console.log('socket disconnect', socket.id);
    if (socket.user?.id) {
      const u = socket.user.id;
      const arr = (onlineUsers.get(u) || []).filter(sid => sid !== socket.id);
      if (arr.length) {
        onlineUsers.set(u, arr);
      } else {
        onlineUsers.delete(u);
        // Update user offline status in database
        await User.findByIdAndUpdate(u, { 
          isOnline: false, 
          lastSeen: new Date() 
        }).catch(err => console.error('Error updating offline status:', err));
        io.emit('user_offline', { userId: u });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start the server after initializing the database
(async () => {
  try {
    await initDatabase();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔍 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
