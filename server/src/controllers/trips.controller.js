const Trip = require('../models/Trip');
const LocationPoint = require('../models/LocationPoint');
const Contact = require('../models/Contact');
const crypto = require('crypto');
const { notifyContacts } = require('../services/notificationService');
const { checkTripStatus } = require('../services/tripMonitorService');
const { CLIENT_URL } = require('../config/env');

const startTrip = async (req, res) => {
  try {
    const { destination, route, expectedArrival, lat, lng, accuracy } = req.body;
    
    // Check for active trip
    const activeTrip = await Trip.findOne({ user: req.user.id, status: { $in: ['active', 'off_route', 'late'] } });
    if (activeTrip) {
      return res.status(400).json({ message: 'An active trip already exists' });
    }

    const trackingToken = crypto.randomBytes(32).toString('hex');
    const contacts = await Contact.find({ user: req.user.id });
    const notifiedContacts = contacts.map(c => c._id);

    const trip = new Trip({
      user: req.user.id,
      destination,
      route,
      expectedArrival,
      trackingToken,
      lastLocation: { lat, lng, accuracy, timestamp: new Date() },
      notifiedContacts
    });

    await trip.save();

    if (lat && lng) {
      const locationPoint = new LocationPoint({ trip: trip._id, lat, lng, accuracy, timestamp: new Date() });
      await locationPoint.save();
    }

    const trackingLink = `${CLIENT_URL}/track-trip/${trackingToken}`;
    
    console.log('\n======================================================');
    console.log('🚗 TRIP STARTED!');
    console.log(`📍 Live Tracking Link: ${trackingLink}`);
    console.log('======================================================\n');

    // Respond immediately
    res.status(201).json(trip);

    // Notify in background
    notifyContacts(trip, contacts, req.user, trackingLink, 'trip').catch(err =>
      console.error('Failed to send trip notifications:', err)
    );
  } catch (error) {
    console.error('startTrip error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, batteryLevel } = req.body;
    const trip = await Trip.findById(req.params.id).populate('user');

    if (!trip || trip.user._id.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (['arrived', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({ message: 'Trip is not active' });
    }

    const timestamp = new Date();
    const locationPoint = new LocationPoint({ trip: trip._id, lat, lng, accuracy, timestamp });
    await locationPoint.save();

    trip.lastLocation = { lat, lng, accuracy, batteryLevel, timestamp };
    
    // Check status
    const io = req.app.get('io');
    const { statusChanged, newStatus } = await checkTripStatus(trip, { lat, lng }, trip.user, io);
    if (statusChanged) {
      if (io) io.to(trip.trackingToken).emit('trip:status_changed', { status: newStatus });
    }

    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip || trip.user.toString() !== req.user.id) return res.status(404).json({ message: 'Trip not found' });

    trip.status = 'cancelled';
    trip.endedAt = new Date();
    await trip.save();

    const io = req.app.get('io');
    if (io) io.to(trip.trackingToken).emit('trip:status_changed', { status: 'cancelled' });

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const trackTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ trackingToken: req.params.token }).populate('user', 'name').populate('responses.contact', 'name');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const path = await LocationPoint.find({ trip: trip._id }).sort({ timestamp: 1 });
    res.json({ trip, path });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const respondToTrip = async (req, res) => {
  try {
    const { token } = req.params;
    const { contactId, responseType } = req.body;

    const trip = await Trip.findOne({ trackingToken: token });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    const responseEntry = { contact: contact._id, responseType, timestamp: new Date() };
    trip.responses.push(responseEntry);
    await trip.save();

    const io = req.app.get('io');
    if (io) io.to(token).emit('contact:responded', { contactName: contact.name, responseType, timestamp: responseEntry.timestamp });

    res.json({ message: 'Response saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ startedAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const extendTrip = async (req, res) => {
  try {
    const { minutes } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip || trip.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });

    trip.expectedArrival = new Date(trip.expectedArrival.getTime() + minutes * 60 * 1000);
    trip.etaAdjustments.push({ addedMinutes: minutes, at: new Date() });
    trip.status = 'active'; // Recover if late
    await trip.save();

    const io = req.app.get('io');
    if (io) io.to(trip.trackingToken).emit('trip:extended', { newEta: trip.expectedArrival });

    res.json(trip);
  } catch(error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const tripOk = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip || trip.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });

    trip.status = 'active';
    trip.offRouteSince = null;
    await trip.save();

    res.json({ message: 'Status cleared' });
  } catch(error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { startTrip, cancelTrip, updateLocation, trackTrip, respondToTrip, getTrips, extendTrip, tripOk };
