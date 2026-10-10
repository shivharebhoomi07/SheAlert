const express = require('express');
const router = express.Router();
const { startTrip, cancelTrip, trackTrip, respondToTrip, updateLocation, getTrips, extendTrip, tripOk } = require('../controllers/trips.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, startTrip);
router.get('/', protect, getTrips);
router.post('/:id/cancel', protect, cancelTrip);
router.post('/:id/location', protect, updateLocation);
router.get('/track/:token', trackTrip);
router.post('/track/:token/respond', respondToTrip);
router.post('/:id/extend', protect, extendTrip);
router.post('/:id/ok', protect, tripOk);

module.exports = router;
