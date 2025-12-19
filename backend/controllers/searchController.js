const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Search users (already exists in userController, but adding here for consistency)
const searchUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    const currentUserId = req.user._id;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchQuery = {
      _id: { $ne: currentUserId },
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(searchQuery)
      .select('-passwordHash -password')
      .limit(20)
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id,
      fullName: user.fullName || user.name,
      username: user.username,
      avatar: user.avatar || user.profilePicture,
      isOnline: user.isOnline !== undefined ? user.isOnline : (user.onlineStatus === 'online'),
      phoneNumber: user.phoneNumber,
      email: user.email
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search chats
const searchChats = async (req, res) => {
  try {
    const q = req.query.q || '';
    const userId = req.user._id;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Find chats where user is a member
    const userChats = await Chat.find({ members: userId })
      .populate('members', 'fullName name username avatar profilePicture')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      });

    // Filter chats by name or member names
    const filteredChats = userChats.filter(chat => {
      if (chat.isGroup) {
        // For groups, search by group name
        return chat.name && chat.name.toLowerCase().includes(q.toLowerCase());
      } else {
        // For 1-on-1 chats, search by other member's name
        const otherMember = chat.members.find(m => m._id.toString() !== userId.toString());
        if (otherMember) {
          const fullName = (otherMember.fullName || otherMember.name || '').toLowerCase();
          const username = (otherMember.username || '').toLowerCase();
          return fullName.includes(q.toLowerCase()) || username.includes(q.toLowerCase());
        }
      }
      return false;
    });

    // Limit results
    const limitedChats = filteredChats.slice(0, 20);

    res.json({ success: true, data: limitedChats });
  } catch (err) {
    console.error('Search chats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search messages in a specific chat
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const q = req.query.q || '';
    const userId = req.user._id;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Verify chat exists and user is a member
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isMember = chat.members.some(m => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Search messages in this chat
    const messages = await Message.find({
      chat: chatId,
      deleted: false,
      content: { $regex: q, $options: 'i' }
    })
      .populate('from', 'fullName name username avatar profilePicture')
      .populate('to', 'fullName name username avatar profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'from',
          select: 'fullName name username'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Search messages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  searchUsers,
  searchChats,
  searchMessages
};

