/**
 * routes/dashboard.routes.js
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRegisteredCustomers,
  getCustomerDetailsAndHistory,
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

router.get('/', protect, adminOnly, getDashboardStats);
router.get('/customers', protect, adminOnly, getRegisteredCustomers);
router.get('/customers/:id', protect, adminOnly, getCustomerDetailsAndHistory);

module.exports = router;
