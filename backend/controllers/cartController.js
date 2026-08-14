const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { calculateCartTotals, getDiscountedPrice } = require('../utils/calculateTotal');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name brand images price discount stock isActive'
  );
  if (!cart) return successResponse(res, 'Cart is empty', { items: [], subtotal: 0, shipping: 0, discount: 0, total: 0 });
  return successResponse(res, 'Cart fetched successfully', cart);
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { productId, quantity = 1, color = '' } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) return errorResponse(res, 'Product not found', 404);
  if (product.stock < quantity) return errorResponse(res, 'Insufficient stock', 400);

  const price = getDiscountedPrice(product.price, product.discount);

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity, price, color }],
    });
  } else {
    const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity, price, color });
    }
  }

  const totals = calculateCartTotals(cart.items);
  Object.assign(cart, totals);
  await cart.save();

  const populated = await Cart.findById(cart._id).populate('items.product', 'name brand images price discount stock');
  return successResponse(res, 'Item added to cart', populated, 201);
};

// @desc    Update item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) return errorResponse(res, 'Invalid quantity', 400);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return errorResponse(res, 'Cart not found', 404);

  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) return errorResponse(res, 'Item not in cart', 404);

  const product = await Product.findById(req.params.productId);
  if (product.stock < quantity) return errorResponse(res, 'Insufficient stock', 400);

  item.quantity = Number(quantity);
  const totals = calculateCartTotals(cart.items);
  Object.assign(cart, totals);
  await cart.save();

  const populated = await Cart.findById(cart._id).populate('items.product', 'name brand images price discount stock');
  return successResponse(res, 'Cart updated', populated);
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return errorResponse(res, 'Cart not found', 404);

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  const totals = calculateCartTotals(cart.items);
  Object.assign(cart, totals);
  await cart.save();

  return successResponse(res, 'Item removed from cart', cart);
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], subtotal: 0, discount: 0, shipping: 0, total: 0 }
  );
  return successResponse(res, 'Cart cleared successfully');
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
