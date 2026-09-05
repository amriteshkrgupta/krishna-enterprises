/**
 * routes/auth.routes.js
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  changePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id/delete', protect, deleteAddress);
router.put('/addresses/:id/default', protect, setDefaultAddress);
router.put('/me/password', protect, changePassword);

module.exports = router;
