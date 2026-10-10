const express = require('express');
const router = express.Router();
const { getContacts, addContact, updateContact, deleteContact } = require('../controllers/contacts.controller');
const { protect } = require('../middleware/auth.middleware');
const { check } = require('express-validator');

router.use(protect);

router.get('/', getContacts);

router.post('/', [
  check('name', 'Name is required').not().isEmpty(),
  check('phone', 'Phone is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail()
], addContact);

router.put('/:id', updateContact);

router.delete('/:id', deleteContact);

module.exports = router;
