const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Submit contact message
// @route   POST /api/contact
// @access  Public
const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  const contact = await Contact.create({ name, email, subject, message });
  return successResponse(res, 'Message sent successfully! We will get back to you soon.', contact, 201);
};

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Admin
const getContacts = async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  return successResponse(res, 'Messages fetched successfully', contacts);
};

// @desc    Mark message as read
// @route   PUT /api/contact/:id/read
// @access  Admin
const markRead = async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!contact) return errorResponse(res, 'Message not found', 404);
  return successResponse(res, 'Marked as read', contact);
};

module.exports = { submitContact, getContacts, markRead };
