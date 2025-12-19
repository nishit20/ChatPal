const Group = require('../models/Group');

const createGroup = async (req, res) => {
  try {
    const { name, memberIds, avatar } = req.body;
    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and at least one member are required' 
      });
    }
    
    // Ensure creator is in members
    const allMembers = [...new Set([req.user._id.toString(), ...memberIds])];
    
    const group = new Group({ 
      name, 
      members: allMembers, 
      admins: [req.user._id], 
      avatar 
    });
    await group.save();
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');
    
    res.json({ success: true, data: group });
  } catch (err) { 
    console.error('Create group error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const addMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    if (!group.admins.map(String).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Only admins can add members' });
    }
    
    if (!group.members.map(String).includes(memberId)) {
      group.members.push(memberId);
      await group.save();
    }
    
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');
    
    res.json({ success: true, data: group });
  } catch (err) { 
    console.error('Add member error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    if (!group.admins.map(String).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    }
    
    group.members = group.members.filter(m => m.toString() !== memberId);
    group.admins = group.admins.filter(a => a.toString() !== memberId);
    await group.save();
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');
    
    res.json({ success: true, data: group });
  } catch (err) { 
    console.error('Remove member error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'fullName name username avatar profilePicture isOnline lastSeen')
      .populate('admins', 'fullName name username avatar');
      
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: group });
  } catch (err) { 
    console.error('Get group error:', err); 
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is an admin
    const isAdmin = group.admins.some(a => a.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can update group' });
    }

    if (name) group.name = name;
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');

    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Update group error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.body;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is an admin
    const isAdmin = group.admins.some(a => a.toString() === currentUserId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can make other users admin' });
    }

    // Check if target user is a member
    const isMember = group.members.some(m => m.toString() === targetUserId);
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'User is not a member of this group' });
    }

    // Check if already an admin
    if (group.admins.some(a => a.toString() === targetUserId)) {
      return res.status(400).json({ success: false, message: 'User is already an admin' });
    }

    group.admins.push(targetUserId);
    await group.save();
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');

    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Make admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { groupId, userId: targetUserId } = req.body;
    const currentUserId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is an admin
    const isAdmin = group.admins.some(a => a.toString() === currentUserId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can remove admin status' });
    }

    // Prevent removing yourself if you're the only admin
    if (group.admins.length === 1 && currentUserId.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the only admin' });
    }

    // Prevent removing yourself
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself as admin' });
    }

    group.admins = group.admins.filter(a => a.toString() !== targetUserId);
    await group.save();
    await group.populate('members', 'fullName name username avatar profilePicture isOnline');
    await group.populate('admins', 'fullName name username avatar');

    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Remove admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  createGroup, 
  addMember, 
  removeMember, 
  getGroup,
  updateGroup,
  makeAdmin,
  removeAdmin
};
