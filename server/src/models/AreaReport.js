const mongoose = require('mongoose');

const areaReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['poor_lighting', 'harassment', 'isolated', 'other'], 
    required: true 
  },
  note: { type: String, maxlength: 200 }
}, { timestamps: true });

// Create an index for geolocation queries
areaReportSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('AreaReport', areaReportSchema);
