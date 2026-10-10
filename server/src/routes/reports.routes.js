const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createReport);
router.get('/', protect, getReports);

module.exports = router;
