const express = require('express');
const router = express.Router();
const { getSavedPlaces, addSavedPlace, deleteSavedPlace } = require('../controllers/places.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getSavedPlaces);
router.post('/', protect, addSavedPlace);
router.delete('/:id', protect, deleteSavedPlace);

module.exports = router;
