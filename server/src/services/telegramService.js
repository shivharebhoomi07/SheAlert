const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_BOT_TOKEN } = require('../config/env');
const Contact = require('../models/Contact');

let bot;

if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const contactId = match[1];

    try {
      const contact = await Contact.findById(contactId);
      if (contact) {
        contact.telegramChatId = chatId;
        await contact.save();
        bot.sendMessage(chatId, `✅ Successfully connected to SheAlert for ${contact.name}! You will now receive SOS alerts here.`);
      } else {
        bot.sendMessage(chatId, `❌ Invalid or expired connect token.`);
      }
    } catch (err) {
      console.error('Error connecting telegram contact:', err);
    }
  });
}

const sendTelegram = async (contact, user, trackingLink, type = 'alert', trip = null) => {
  if (!bot) throw new Error('Telegram bot not configured');
  if (!contact.telegramChatId) throw new Error('Contact has not connected Telegram yet');

  let text = '';
  if (type === 'alert') {
    text = `🚨 *EMERGENCY*: ${user.name} triggered an SOS!\n\nTrack live location here: ${trackingLink}`;
  } else if (type === 'safe') {
    text = `✅ *SheAlert*: ${user.name} has marked themselves as SAFE. The alert has ended.`;
  } else if (type === 'trip') {
    const time = new Date(trip.expectedArrival).toLocaleTimeString();
    text = `📍 *TRIP*: ${user.name} is heading to ${trip.destination.address}.\nETA: ${time}\n\nFollow her live here: ${trackingLink}`;
  } else if (type === 'arrived') {
    text = `✅ *ARRIVED*: ${user.name} arrived safely at ${trip.destination.address}.`;
  }

  try {
    await bot.sendMessage(contact.telegramChatId, text, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`Failed to send Telegram to ${contact.name}`);
  }
};

module.exports = { sendTelegram };
