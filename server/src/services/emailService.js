const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

const sendEmail = async (contact, user, trackingLink, type = 'alert', trip = null) => {
  let subject, html;

  if (type === 'alert') {
    subject = `🚨 EMERGENCY: ${user.name} has triggered an SOS Alert!`;
    html = `<h2>Emergency Alert</h2><p><strong>${user.name}</strong> has triggered an SOS alert.</p><a href="${trackingLink}">Track Live Location</a>`;
  } else if (type === 'safe') {
    subject = `✅ SAFE: ${user.name} has marked themselves as safe`;
    html = `<h2>Safety Confirmed</h2><p><strong>${user.name}</strong> has stopped their SOS alert and is now safe.</p>`;
  } else if (type === 'trip') {
    const time = new Date(trip.expectedArrival).toLocaleTimeString();
    const dest = trip.destination.address.split(',')[0];
    subject = `📍 TRIP: ${user.name} is heading to ${dest}`;
    html = `<h2>Trip Started</h2><p><strong>${user.name}</strong> is heading to ${trip.destination.address}. ETA ${time}.</p><a href="${trackingLink}">Follow her live</a>`;
  } else if (type === 'arrived') {
    const dest = trip.destination.address.split(',')[0];
    subject = `✅ ARRIVED: ${user.name} arrived safely at ${dest}`;
    html = `<h2>Arrived Safely</h2><p><strong>${user.name}</strong> arrived safely at ${trip.destination.address}.</p>`;
  }

  try {
    await transporter.sendMail({
      from: '"SheAlert" <noreply@shealert.com>',
      to: contact.email,
      subject,
      html
    });
  } catch (error) {
    console.error(`Failed to send email to ${contact.email}`);
  }
};

module.exports = { sendEmail };
