const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  relationship: { type: String },
  telegramChatId: { type: String },
  notifyVia: { 
    type: [{ type: String, enum: ['email', 'sms', 'telegram'] }], 
    default: ['email', 'telegram'] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
