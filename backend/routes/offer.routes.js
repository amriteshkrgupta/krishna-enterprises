/**
 * routes/offer.routes.js
 */

const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
} = require('../controllers/offer.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

// Customer
router.post('/validate', protect, validateCoupon);

// Admin
router.post('/admin', protect, adminOnly, createOffer);
router.get('/admin', protect, adminOnly, getAllOffers);
router.put('/admin/:id', protect, adminOnly, updateOffer);
router.delete('/admin/:id', protect, adminOnly, deleteOffer);

module.exports = router;
