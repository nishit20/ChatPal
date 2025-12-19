const Chat = require('../models/Chat');
const Message = require('../models/Message');

const createChat = async (req, res) => {
  try {
    const { members, name, isGroup } = req.body;
    if (!isGroup && members.length === 2) {
      const existing = await Chat.findOne({ isGroup: false, members: { $all: members, $size: 2 } })
        .populate('members', 'fullName name username avatar profilePicture isOnline')
        .populate('lastMessage');
      if (existing) {
        return res.json({ success: true, data: existing });
      }
    }
    const chat = new Chat({ isGroup: !!isGroup, name: name || null, members, admins: members.slice(0,1) });
    await chat.save();
    await chat.populate('members', 'fullName name username avatar profilePicture isOnline');
    res.json({ success: true, data: chat });
  } catch (err) { 
    console.error('Create chat error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const getChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId)
      .populate('members', 'fullName name username avatar profilePicture isOnline lastSeen')
      .populate('admins', 'fullName name username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Check if user is a member
    const isMember = chat.members.some(m => m._id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get unread count for this user
    const unreadCount = await Message.countDocuments({
      chat: chatId,
      from: { $ne: userId },
      readBy: { $ne: userId },
      deleted: false
    });

    res.json({
      success: true,
      data: {
        ...chat.toObject(),
        unreadCount
      }
    });
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const messages = await Message.find({ chat: chatId, deleted: false })
      .populate('from', 'fullName name username avatar profilePicture onlineStatus')
      .populate('to', 'fullName name username avatar profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      })
      .sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) { 
    console.error('Get messages error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ members: userId })
      .populate('members', 'fullName name username avatar profilePicture isOnline lastSeen')
      .populate('admins', 'fullName name username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      })
      .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          from: { $ne: userId },
          readBy: { $ne: userId },
          deleted: false
        });
        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json({ success: true, data: chatsWithUnread });
  } catch (err) { 
    console.error('Get user chats error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const createOrGetChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create chat with yourself' });
    }

    // Check if 1-on-1 chat already exists
    const existingChat = await Chat.findOne({
      isGroup: false,
      members: { $all: [currentUserId, userId], $size: 2 }
    }).populate('members', 'fullName username avatar profilePicture isOnline');

    if (existingChat) {
      return res.json({
        success: true,
        chat: existingChat,
        chatId: existingChat._id,
        isNew: false
      });
    }

    // Create new 1-on-1 chat
    const newChat = new Chat({
      isGroup: false,
      members: [currentUserId, userId],
      admins: [currentUserId]
    });

    await newChat.save();
    await newChat.populate('members', 'fullName username avatar profilePicture isOnline');

    res.json({
      success: true,
      chat: newChat,
      chatId: newChat._id,
      isNew: true
    });
  } catch (err) {
    console.error('Create or get chat error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Check if user is a member
    const isMember = chat.members.some(m => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // For group chats, only admins can delete
    if (chat.isGroup) {
      const isAdmin = chat.admins.some(a => a.toString() === userId.toString());
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only admins can delete group chats' });
      }
    }

    // Soft delete: remove user from members
    if (!chat.isGroup) {
      // For 1-on-1 chats, just remove the user from members
      chat.members = chat.members.filter(m => m.toString() !== userId.toString());
      await chat.save();
    } else {
      // For group chats, delete the entire chat
      await Chat.findByIdAndDelete(chatId);
      // Optionally delete all messages
      await Message.updateMany({ chat: chatId }, { deleted: true });
    }

    res.json({ success: true, data: { message: 'Chat deleted successfully' } });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createChat, getChat, getMessages, getUserChats, createOrGetChat, deleteChat };
