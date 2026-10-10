const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  trackingToken: { type: String, required: true, unique: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    timestamp: { type: Date }
  },
  notifiedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  notificationResults: [{
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    channel: String,
    status: String,
    error: String
  }],
  responses: [{
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    responseType: String,
    timestamp: { type: Date, default: Date.now }
  }],
  batteryLevel: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
