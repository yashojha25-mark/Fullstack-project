const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, markFeedbackRead } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { contactLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/', contactLimiter, submitFeedback);
router.get('/', protect, adminOnly, getAllFeedback);
router.put('/:id/read', protect, adminOnly, markFeedbackRead);

module.exports = router;
