/**
 * routes/upload.routes.js
 */

const express = require('express');
const router = express.Router();
const { uploadImages, deleteImage } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { upload } = require('../utils/s3');

router.post('/', protect, adminOnly, upload.array('images', 5), uploadImages);
router.delete('/', protect, adminOnly, deleteImage);

module.exports = router;
