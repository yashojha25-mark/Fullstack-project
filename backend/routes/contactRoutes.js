const express = require('express');
const router = express.Router();
const { submitContact, getContacts, markRead } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { contactLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/', contactLimiter, submitContact);
router.get('/', protect, adminOnly, getContacts);
router.put('/:id/read', protect, adminOnly, markRead);

module.exports = router;
