const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  route: { type: String, default: '' }, // encoded polyline (optional)
  expectedArrival: { type: Date, required: true },
  status: { type: String, enum: ['active', 'arrived', 'off_route', 'late', 'cancelled'], default: 'active' },
  trackingToken: { type: String, required: true, unique: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  arrivedAt: { type: Date },
  notifiedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  progress: { type: Number, default: 0 },
  distanceLeftMeters: { type: Number },
  etaAdjustments: [{ addedMinutes: Number, at: { type: Date, default: Date.now } }],
  watchers: { type: Number, default: 0 },
  escalatedToAlert: { type: Boolean, default: false },
  responses: [{
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    responseType: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    batteryLevel: { type: Number },
    timestamp: { type: Date }
  },
  offRouteSince: { type: Date } // Internal state to track 2-minute delay
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
