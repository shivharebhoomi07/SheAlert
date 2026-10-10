const { sendEmail } = require('./emailService');
const { sendTelegram } = require('./telegramService');

const notifyContacts = async (entity, contacts, user, trackingLink, type = 'alert') => {
  const results = [];

  for (const contact of contacts) {
    const notifyVia = contact.notifyVia || ['email'];
    const contactTrackingLink = `${trackingLink}?c=${contact._id}`;
    
    for (const channel of notifyVia) {
      if (channel === 'whatsapp') continue;
      
      try {
        if (channel === 'email') {
          await sendEmail(contact, user, contactTrackingLink, type, entity);
        } else if (channel === 'telegram') {
          await sendTelegram(contact, user, contactTrackingLink, type, entity);
        }
        results.push({ contact: contact._id, channel, status: 'sent' });
      } catch (error) {
        results.push({ contact: contact._id, channel, status: 'failed' });
      }
    }
  }

  entity.notificationResults = [...(entity.notificationResults || []), ...results];
  await entity.save();
};

module.exports = { notifyContacts };
