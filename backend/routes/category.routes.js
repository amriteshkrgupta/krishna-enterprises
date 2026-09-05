/**
 * routes/category.routes.js
 */

const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

// Public
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin
router.post('/admin', protect, adminOnly, createCategory);
router.put('/admin/:id', protect, adminOnly, updateCategory);
router.delete('/admin/:id', protect, adminOnly, deleteCategory);

module.exports = router;
