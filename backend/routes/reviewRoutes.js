const express = require('express');
const router = express.Router({ mergeParams: true });
const { getReviews, addReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// /api/products/:productId/reviews
router.get('/', getReviews);
router.post('/', protect, addReview);

// /api/reviews/:reviewId
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
