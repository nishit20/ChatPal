const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Call = require('../models/Call');
const User = require('../models/User');

// Start a call
router.post('/:userId/start', auth, async (req, res) => {
  try {
    const { type } = req.body; // 'audio' or 'video'
    const callerId = req.user.id;
    const recipientId = req.params.userId;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create call document
    const call = new Call({
      caller: callerId,
      recipient: recipientId,
      type: type || 'audio',
      status: 'ringing',
      startedAt: new Date(),
    });

    await call.save();
    const populatedCall = await call.populate(['caller', 'recipient']);

    res.json({ success: true, data: populatedCall });
  } catch (error) {
    console.error('Error starting call:', error);
    res.status(500).json({ success: false, message: 'Failed to start call' });
  }
});

// Accept a call
router.post('/:callId/accept', auth, async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(
      req.params.callId,
      { status: 'active', acceptedAt: new Date() },
      { new: true }
    ).populate(['caller', 'recipient']);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    res.json({ success: true, data: call });
  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({ success: false, message: 'Failed to accept call' });
  }
});

// Decline/end a call
router.post('/:callId/end', auth, async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(
      req.params.callId,
      { 
        status: 'ended', 
        endedAt: new Date(),
        duration: req.body.duration || 0
      },
      { new: true }
    ).populate(['caller', 'recipient']);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    res.json({ success: true, data: call });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ success: false, message: 'Failed to end call' });
  }
});

// Get call history for a user
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const calls = await Call.find({
      $or: [{ caller: userId }, { recipient: userId }],
    })
      .populate(['caller', 'recipient'])
      .sort({ startedAt: -1 })
      .limit(50);

    res.json({ success: true, data: calls });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch call history' });
  }
});

// Get specific call
router.get('/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId).populate(['caller', 'recipient']);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    res.json({ success: true, data: call });
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch call' });
  }
});

module.exports = router;
