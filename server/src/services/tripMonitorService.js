const polyline = require('@mapbox/polyline');
const { point, lineString } = require('@turf/helpers');
const pointToLineDistance = require('@turf/point-to-line-distance').default;
const distance = require('@turf/distance').default;
const { notifyContacts } = require('./notificationService');
const { CLIENT_URL } = require('../config/env');

const checkTripStatus = async (trip, newLocation, user, io) => {
  if (['arrived', 'cancelled'].includes(trip.status)) {
    return trip;
  }

  const currentPt = point([newLocation.lng, newLocation.lat]);
  const destPt = point([trip.destination.lng, trip.destination.lat]);
  
  // 1. Calculate distance left and update it
  const distToDest = distance(currentPt, destPt, { units: 'meters' });
  trip.distanceLeftMeters = distToDest;

  // 1a. Check if arrived
  if (distToDest <= 100) {
    trip.status = 'arrived';
    trip.arrivedAt = new Date();
    trip.progress = 1;
    await trip.save();
    
    // Notify contacts safely arrived
    const contacts = require('../models/Contact').find({ user: user._id }); // lazy load
    contacts.then(cs => {
       const trackingLink = `${CLIENT_URL}/track-trip/${trip.trackingToken}`;
       notifyContacts(trip, cs, user, trackingLink, 'arrived').catch(e => console.error(e));
    });

    if (io) io.to(trip.trackingToken).emit('trip:arrived', { trip });
    return { statusChanged: true, newStatus: 'arrived' };
  }

  // Calculate Progress (0 to 1) based on route length if possible
  // A simplistic progress is 1 - (distanceLeft / originalDistance) but we don't store originalDistance
  // Alternatively, just update distanceLeft on frontend

  // 2. Check distance to route (if route exists)
  if (trip.route) {
    try {
      const decoded = polyline.decode(trip.route);
      if (decoded.length > 1) {
        const routeLine = lineString(decoded.map(c => [c[1], c[0]]));
        const distToRoute = pointToLineDistance(currentPt, routeLine, { units: 'meters' });
        
        if (distToRoute > 300) {
          if (!trip.offRouteSince) {
            trip.offRouteSince = new Date();
          } else {
            const msOffRoute = new Date() - trip.offRouteSince;
            if (msOffRoute > 2 * 60 * 1000 && trip.status !== 'off_route') {
              trip.status = 'off_route';
              if (io) io.to(`user_${user._id}`).emit('trip:safety_check', { reason: 'off_route', tripId: trip._id });
              return { statusChanged: true, newStatus: 'off_route' };
            }
          }
        } else {
          trip.offRouteSince = null; // back on route
          if (trip.status === 'off_route') {
            trip.status = 'active';
            if (io) io.to(`user_${user._id}`).emit('trip:safety_check_cleared', { tripId: trip._id });
            return { statusChanged: true, newStatus: 'active' };
          }
        }
      }
    } catch(e) {
      console.error('Polyline decode error:', e);
    }
  }

  // 3. Check if late
  const now = new Date();
  if (now > trip.expectedArrival && trip.status !== 'late') {
    // If they are more than 10 mins late
    if (now.getTime() - trip.expectedArrival.getTime() > 10 * 60 * 1000) {
       trip.status = 'late';
       if (io) io.to(`user_${user._id}`).emit('trip:safety_check', { reason: 'late', tripId: trip._id });
       return { statusChanged: true, newStatus: 'late' };
    }
  }

  // 4. Stopped for too long
  if (trip.lastLocation && trip.lastLocation.timestamp) {
    const timeSinceLastLoc = now.getTime() - trip.lastLocation.timestamp.getTime();
    if (timeSinceLastLoc > 10 * 60 * 1000) {
       const lastPt = point([trip.lastLocation.lng, trip.lastLocation.lat]);
       const distMoved = distance(lastPt, currentPt, { units: 'meters' });
       if (distMoved < 50 && trip.status !== 'stopped') {
          trip.status = 'stopped';
          if (io) io.to(`user_${user._id}`).emit('trip:safety_check', { reason: 'stopped', tripId: trip._id });
          return { statusChanged: true, newStatus: 'stopped' };
       }
    }
  }

  return { statusChanged: false, newStatus: trip.status };
};

module.exports = { checkTripStatus };
