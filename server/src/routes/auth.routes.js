const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { check } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('phone', 'Phone is required').not().isEmpty()
], registerUser);

router.post('/login', authLimiter, [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], loginUser);

router.get('/me', protect, getMe);

module.exports = router;
