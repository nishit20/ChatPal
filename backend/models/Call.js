const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    status: {
      type: String,
      enum: ['ringing', 'active', 'ended', 'declined', 'missed'],
      default: 'ringing',
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    acceptedAt: Date,
    endedAt: Date,
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Call', callSchema);
