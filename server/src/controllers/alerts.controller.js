const Alert = require('../models/Alert');
const LocationPoint = require('../models/LocationPoint');
const Contact = require('../models/Contact');
const crypto = require('crypto');
const { notifyContacts } = require('../services/notificationService');
const { CLIENT_URL } = require('../config/env');

const startAlert = async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    
    // Check if there is an active alert already
    const activeAlert = await Alert.findOne({ user: req.user.id, status: 'active' });
    if (activeAlert) {
      return res.status(400).json({ message: 'An active alert already exists', alert: activeAlert });
    }

    // Generate tracking token
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    const contacts = await Contact.find({ user: req.user.id });
    const notifiedContacts = contacts.map(c => c._id);

    const alert = new Alert({
      user: req.user.id,
      trackingToken,
      lastLocation: { lat, lng, accuracy, timestamp: new Date() },
      notifiedContacts
    });

    await alert.save();

    if (lat && lng) {
      const locationPoint = new LocationPoint({
        alert: alert._id,
        lat,
        lng,
        accuracy,
        timestamp: new Date()
      });
      await locationPoint.save();
    }

    // Send notifications
    const trackingLink = `${CLIENT_URL}/track/${trackingToken}`;
    
    // Log the link to the terminal so you can click it easily during testing!
    console.log('\n======================================================');
    console.log('🚨 SOS ALERT TRIGGERED!');
    console.log(`📍 Live Tracking Link: ${trackingLink}`);
    console.log('======================================================\n');

    // Respond immediately so the SOS screen appears instantly
    res.status(201).json(alert);

    // Send notifications in the background (don't block)
    notifyContacts(alert, contacts, req.user, trackingLink, 'alert').catch(err =>
      console.error('Failed to send alert notifications:', err)
    );
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, batteryLevel } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (alert.status !== 'active') {
      return res.status(400).json({ message: 'Alert is not active' });
    }

    const timestamp = new Date();

    const locationPoint = new LocationPoint({
      alert: alert._id,
      lat,
      lng,
      accuracy,
      timestamp
    });

    await locationPoint.save();

    alert.lastLocation = { lat, lng, accuracy, timestamp };
    if (batteryLevel !== undefined) {
      alert.batteryLevel = batteryLevel;
    }
    await alert.save();

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const stopAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    alert.status = 'resolved';
    alert.endedAt = new Date();
    await alert.save();

    // Respond immediately so the UI is instant
    res.json(alert);

    // Send follow-up notifications in the background (don't block)
    const contacts = await Contact.find({ user: req.user.id });
    notifyContacts(alert, contacts, req.user, null, 'safe').catch(err =>
      console.error('Failed to send safe notifications:', err)
    );
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id })
      .populate('responses.contact', 'name')
      .sort({ startedAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const trackAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ trackingToken: req.params.token })
                             .populate('user', 'name');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const path = await LocationPoint.find({ alert: alert._id }).sort({ timestamp: 1 });

    res.json({
      alert: {
        status: alert.status,
        lastLocation: alert.lastLocation,
        startedAt: alert.startedAt,
        endedAt: alert.endedAt,
        user: alert.user,
        batteryLevel: alert.batteryLevel,
        responses: alert.responses
      },
      path
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const respondToAlert = async (req, res) => {
  try {
    const { token } = req.params;
    const { contactId, responseType } = req.body;

    const alert = await Alert.findOne({ trackingToken: token });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const responseEntry = {
      contact: contact._id,
      responseType,
      timestamp: new Date()
    };

    alert.responses.push(responseEntry);
    await alert.save();

    // Emit to room
    const io = req.app.get('io');
    if (io) {
      io.to(token).emit('contact:responded', {
        contactName: contact.name,
        responseType,
        timestamp: responseEntry.timestamp
      });
    }

    res.json({ message: 'Response saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  startAlert,
  updateLocation,
  stopAlert,
  getAlerts,
  trackAlert,
  respondToAlert
};
