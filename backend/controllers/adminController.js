const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const Contact = require('../models/Contact');
const Review = require('../models/Review');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboard = async (req, res) => {
  const [
    totalProducts,
    totalUsers,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    unreadMessages,
    unreadFeedback,
    revenueData,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.countDocuments({ orderStatus: 'Delivered' }),
    Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock brand'),
    Contact.countDocuments({ isRead: false }),
    Feedback.countDocuments({ isRead: false }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  return successResponse(res, 'Dashboard data fetched', {
    totalProducts,
    totalUsers,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
    lowStockProducts,
    unreadMessages,
    unreadFeedback,
  });
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return successResponse(res, 'Users fetched successfully', users);
};

// @desc    Update user role (admin)
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return errorResponse(res, 'Invalid role', 400);
  }

  if (req.params.id === req.user._id.toString()) {
    return errorResponse(res, 'Cannot change your own role', 400);
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, 'User role updated', user);
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  return successResponse(res, 'Orders fetched successfully', orders);
};

// @desc    Update order status (admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid order status', 400);
  }

  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, 'Order not found', 404);

  order.orderStatus = status;
  if (status === 'Delivered') order.paymentStatus = 'Paid';
  order.statusHistory.push({ status, note: note || `Status updated to ${status}` });
  await order.save();

  return successResponse(res, 'Order status updated', order);
};

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Admin
const getAllReviews = async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name email')
    .populate('product', 'name')
    .sort({ createdAt: -1 });
  return successResponse(res, 'Reviews fetched successfully', reviews);
};

module.exports = {
  getDashboard,
  getAllUsers,
  updateUserRole,
  getAllOrders,
  updateOrderStatus,
  getAllReviews,
};
