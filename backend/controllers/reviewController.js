const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
const getReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  return successResponse(res, 'Reviews fetched successfully', reviews);
};

// @desc    Add review
// @route   POST /api/products/:productId/reviews
// @access  Private
const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) return errorResponse(res, 'Product not found', 404);

  // Check if user already reviewed
  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) return errorResponse(res, 'You have already reviewed this product', 409);

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment,
  });

  const populated = await Review.findById(review._id).populate('user', 'name avatar');
  return successResponse(res, 'Review added successfully', populated, 201);
};

// @desc    Update review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return errorResponse(res, 'Review not found', 404);

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to update this review', 403);
  }

  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;
  await review.save();

  await Review.calcAverageRating(review.product);
  return successResponse(res, 'Review updated successfully', review);
};

// @desc    Delete review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return errorResponse(res, 'Review not found', 404);

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to delete this review', 403);
  }

  const productId = review.product;
  await review.deleteOne();
  await Review.calcAverageRating(productId);
  return successResponse(res, 'Review deleted successfully');
};

module.exports = { getReviews, addReview, updateReview, deleteReview };
