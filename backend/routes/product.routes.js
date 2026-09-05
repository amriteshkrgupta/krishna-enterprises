/**
 * routes/product.routes.js
 */

const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  bulkUpdateProducts,
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { upload } = require('../utils/s3');

// Public routes - static first
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin routes - static before parameterised
router.get('/admin/low-stock', protect, adminOnly, getLowStockProducts);
router.post('/admin/bulk-action', protect, adminOnly, bulkUpdateProducts);
router.post('/admin', protect, adminOnly, upload.array('images', 5), createProduct);
router.put('/admin/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.delete('/admin/:id', protect, adminOnly, deleteProduct);
router.put('/admin/:id/stock', protect, adminOnly, updateStock);

module.exports = router;
