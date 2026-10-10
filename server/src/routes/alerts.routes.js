const express = require('express');
const router = express.Router();
const { startAlert, updateLocation, stopAlert, getAlerts, trackAlert, respondToAlert } = require('../controllers/alerts.controller');
const { protect } = require('../middleware/auth.middleware');
const { sosLimiter } = require('../middleware/rateLimiter');

router.post('/start', protect, sosLimiter, startAlert);
router.post('/:id/location', protect, updateLocation);
router.post('/:id/stop', protect, stopAlert);
router.get('/', protect, getAlerts);
router.get('/track/:token', trackAlert);
router.post('/track/:token/respond', respondToAlert);

module.exports = router;
