const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.post('/create', auth, chatController.createChat);
router.post('/createOrGet', auth, chatController.createOrGetChat);
router.get('/', auth, chatController.getUserChats);
router.get('/:id', auth, chatController.getChat);
router.get('/:id/messages', auth, chatController.getMessages);
router.delete('/:id', auth, chatController.deleteChat);

// Search messages (legacy route - use /api/search/messages/:chatId instead)
router.get('/:id/search', auth, async (req, res) => {
  try {
    const { q, type } = req.query;
    const Message = require('../models/Message');
    
    const query = {
      chat: req.params.id,
      deleted: false,
      content: { $regex: q || '', $options: 'i' }
    };
    
    if (type) query.type = type;
    
    const messages = await Message.find(query)
      .populate('from', 'fullName name username')
      .populate('to', 'fullName name username')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Star message
router.post('/:id/star', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageId } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    message.starred = !message.starred;
    await message.save();
    await message.populate('from', 'fullName name username avatar profilePicture');
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Star error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get starred messages
router.get('/:id/starred', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    
    const messages = await Message.find({
      chat: req.params.id,
      starred: true,
      deleted: false
    })
      .populate('from', 'fullName name username avatar profilePicture')
      .populate('to', 'fullName name username avatar profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get starred error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unstar message
router.post('/:id/unstar', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageId } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    message.starred = false;
    await message.save();
    await message.populate('from', 'fullName name username avatar profilePicture');
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Unstar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forward message
router.post('/:id/forward', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { originalMessageId, content, type } = req.body;
    
    const newMessage = new Message({
      chat: req.params.id,
      from: req.user.id,
      content,
      type,
      forwardedFrom: originalMessageId
    });
    
    await newMessage.save();
    await newMessage.populate('from', 'fullName name username avatar profilePicture');
    
    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
