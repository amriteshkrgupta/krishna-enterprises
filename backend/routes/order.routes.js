/**
 * routes/order.routes.js
 * Static admin routes declared before parameterised /:id routes.
 */

const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

// Admin routes — must come before /:id
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);

// Customer routes
router.post('/', protect, placeOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
