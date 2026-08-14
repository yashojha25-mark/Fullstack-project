const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    'products',
    'name brand images price discount rating reviewCount isNew isTrending stock'
  );
  if (!wishlist) return successResponse(res, 'Wishlist is empty', { products: [] });
  return successResponse(res, 'Wishlist fetched successfully', wishlist);
};

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) return errorResponse(res, 'Product not found', 404);

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
  } else {
    if (wishlist.products.includes(productId)) {
      return errorResponse(res, 'Product already in wishlist', 409);
    }
    wishlist.products.push(productId);
    await wishlist.save();
  }

  return successResponse(res, 'Added to wishlist', null, 201);
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) return errorResponse(res, 'Wishlist not found', 404);

  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();
  return successResponse(res, 'Removed from wishlist');
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
