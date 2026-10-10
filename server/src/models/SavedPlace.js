const mongoose = require('mongoose');

const savedPlaceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SavedPlace', savedPlaceSchema);
