const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  updateUserRole,
  getAllOrders,
  updateOrderStatus,
  getAllReviews,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/reviews', getAllReviews);

module.exports = router;
