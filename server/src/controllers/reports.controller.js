const AreaReport = require('../models/AreaReport');

const createReport = async (req, res) => {
  try {
    const { lat, lng, category, note } = req.body;
    
    // Rate limit: Check if user created a report in last 10 mins
    const recentReport = await AreaReport.findOne({ 
      user: req.user.id, 
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } 
    });
    if (recentReport) {
      return res.status(429).json({ message: 'You can only submit one report every 10 minutes.' });
    }

    const report = new AreaReport({ user: req.user.id, lat, lng, category, note });
    await report.save();
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getReports = async (req, res) => {
  try {
    // bounds should be SW_lat,SW_lng,NE_lat,NE_lng
    const { bounds } = req.query;
    let query = {
      createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } // last 6 months
    };

    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
      query.lat = { $gte: swLat, $lte: neLat };
      query.lng = { $gte: swLng, $lte: neLng };
    }

    const reports = await AreaReport.find(query).select('lat lng category createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createReport, getReports };
