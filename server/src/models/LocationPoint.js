const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema({
  alert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', index: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number },
  timestamp: { type: Date, required: true }
}, { timestamps: false });

locationPointSchema.index({ alert: 1, timestamp: 1 });
locationPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('LocationPoint', locationPointSchema);
