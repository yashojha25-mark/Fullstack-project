const Feedback = require('../models/Feedback');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public
const submitFeedback = async (req, res) => {
  const { name, email, rating, message } = req.body;
  const feedback = await Feedback.create({
    user: req.user?._id,
    name,
    email,
    rating,
    message,
  });
  return successResponse(res, 'Thank you for your feedback!', feedback, 201);
};

// @desc    Get all feedback (admin)
// @route   GET /api/feedback
// @access  Admin
const getAllFeedback = async (req, res) => {
  const feedback = await Feedback.find().sort({ createdAt: -1 }).populate('user', 'name email');
  return successResponse(res, 'Feedback fetched successfully', feedback);
};

// @desc    Mark feedback as read
// @route   PUT /api/feedback/:id/read
// @access  Admin
const markFeedbackRead = async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!feedback) return errorResponse(res, 'Feedback not found', 404);
  return successResponse(res, 'Marked as read', feedback);
};

module.exports = { submitFeedback, getAllFeedback, markFeedbackRead };
