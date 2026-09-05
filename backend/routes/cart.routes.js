/**
 * routes/cart.routes.js
 * All routes require authentication.
 * DELETE / (clear cart) must be declared BEFORE DELETE /:productId
 * to avoid Express treating "clear" as a productId.
 */

const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // apply auth to all cart routes

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
