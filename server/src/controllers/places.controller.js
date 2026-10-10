const SavedPlace = require('../models/SavedPlace');

const getSavedPlaces = async (req, res) => {
  try {
    const places = await SavedPlace.find({ user: req.user.id });
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const addSavedPlace = async (req, res) => {
  try {
    const { name, lat, lng, address } = req.body;
    const place = new SavedPlace({ user: req.user.id, name, lat, lng, address });
    await place.save();
    res.status(201).json(place);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteSavedPlace = async (req, res) => {
  try {
    const place = await SavedPlace.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Not found' });
    if (place.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await place.remove();
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getSavedPlaces, addSavedPlace, deleteSavedPlace };
