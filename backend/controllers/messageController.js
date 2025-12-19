const Message = require('../models/Message');
const ChatModel = require('../models/Chat');
const { getIO } = require('../services/socket');

// Create a new message
const createMessage = async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo, file, duration } = req.body;
    const userId = req.user._id;

    if (!chatId || (!content && !file)) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and content or file are required'
      });
    }

    // Verify chat exists and user is a member
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isMember = chat.members.some(m => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Determine recipient (for 1-on-1 chats)
    let to = null;
    if (!chat.isGroup && chat.members.length === 2) {
      to = chat.members.find(m => m.toString() !== userId.toString());
    }

    const message = new Message({
      chat: chatId,
      from: userId,
      to,
      type,
      content: content || file,
      file: file || null,
      duration: duration || null,
      replyTo: replyTo || null
    });

    await message.save();
    await message.populate('from', 'fullName name username avatar profilePicture');
    await message.populate('to', 'fullName name username avatar profilePicture');
    
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      });
    }

    // Update chat's last message
    await ChatModel.findByIdAndUpdate(chatId, {
      lastMessage: message.content || message.file || 'Media',
      updatedAt: new Date()
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(chatId.toString()).emit('receive_message', message);
      if (to) {
        io.to(to.toString()).emit('message_delivered', { messageId: message._id });
      }
    }

    res.json({
      success: true,
      data: message
    });
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Edit a message
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.from.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    // Check if message is deleted
    if (message.deleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit deleted message' });
    }

    message.content = content;
    message.edited = true;
    await message.save();
    await message.populate('from', 'fullName name username avatar profilePicture');
    await message.populate('to', 'fullName name username avatar profilePicture');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(message.chat.toString()).emit('message_edited', message);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the sender or admin
    const chat = await ChatModel.findById(message.chat);
    const isSender = message.from.toString() === userId.toString();
    const isAdmin = chat && chat.admins && chat.admins.some(a => a.toString() === userId.toString());

    if (!isSender && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    message.deleted = true;
    message.content = 'This message was deleted';
    await message.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(message.chat.toString()).emit('message_deleted', { messageId: message._id });
    }

    res.json({
      success: true,
      data: { message: 'Message deleted successfully' }
    });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// React to a message
const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId.toString()
    );

    // Add new reaction
    message.reactions.push({ user: userId, emoji });
    await message.save();
    await message.populate('reactions.user', 'fullName name username');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(message.chat.toString()).emit('message_reacted', { 
        messageId: message._id, 
        reactions: message.reactions 
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (err) {
    console.error('React to message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark message as read
const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if already read
    if (message.readBy.includes(userId)) {
      return res.json({
        success: true,
        data: { message: 'Message already read' }
      });
    }

    message.readBy.push(userId);
    await message.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(message.chat.toString()).emit('message_read', { 
        messageId: message._id, 
        userId: userId.toString() 
      });
    }

    res.json({
      success: true,
      data: { message: 'Message marked as read' }
    });
  } catch (err) {
    console.error('Mark message read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark all messages in a chat as read
const markChatRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Verify chat exists and user is a member
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isMember = chat.members.some(m => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Mark all unread messages in this chat as read
    await Message.updateMany(
      {
        chat: chatId,
        from: { $ne: userId },
        readBy: { $ne: userId },
        deleted: false
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.json({
      success: true,
      data: { message: 'All messages marked as read' }
    });
  } catch (err) {
    console.error('Mark chat read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  markMessageRead,
  markChatRead
};

