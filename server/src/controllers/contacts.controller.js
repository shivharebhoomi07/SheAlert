const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const addContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const contactsCount = await Contact.countDocuments({ user: req.user.id });
    if (contactsCount >= 5) {
      return res.status(400).json({ message: 'Maximum 5 contacts allowed' });
    }

    const { name, phone, email, relationship, notifyVia } = req.body;

    const contact = new Contact({
      user: req.user.id,
      name,
      phone,
      email,
      relationship,
      notifyVia
    });

    const savedContact = await contact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateContact = async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact
};
