const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = 'COD', notes } = req.body;

  // Get cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return errorResponse(res, 'Your cart is empty', 400);
  }

  // Validate stock and build order items
  const orderItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return errorResponse(res, `Product ${item.product} is no longer available`, 400);
    }
    if (product.stock < item.quantity) {
      return errorResponse(res, `Insufficient stock for ${product.name}`, 400);
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: item.price,
      quantity: item.quantity,
      color: item.color,
    });
    // Reduce stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    orderStatus: 'Confirmed',
    subtotal: cart.subtotal,
    discount: cart.discount,
    shippingCost: cart.shipping,
    totalAmount: cart.total,
    notes,
    statusHistory: [{ status: 'Confirmed', note: 'Order placed successfully' }],
  });

  // Clear cart after order
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], subtotal: 0, discount: 0, shipping: 0, total: 0 }
  );

  return successResponse(res, 'Order placed successfully', order, 201);
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images brand');
  return successResponse(res, 'Orders fetched successfully', orders);
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images brand');
  if (!order) return errorResponse(res, 'Order not found', 404);

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return errorResponse(res, 'Not authorized to view this order', 403);
  }
  return successResponse(res, 'Order fetched successfully', order);
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, 'Order not found', 404);

  if (order.user.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
    return errorResponse(res, 'Cannot cancel this order at this stage', 400);
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  order.orderStatus = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled', note: 'Cancelled by user' });
  await order.save();

  return successResponse(res, 'Order cancelled successfully', order);
};

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
