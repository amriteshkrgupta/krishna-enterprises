/**
 * controllers/upload.controller.js
 * Handles image upload responses from multer-s3 and S3 delete requests.
 */

const asyncHandler = require('express-async-handler');
const { deleteFromS3 } = require('../utils/s3');

/**
 * @desc  Return URLs of images uploaded to S3 (via multer-s3 middleware)
 * @route POST /api/upload
 * @access Private/Admin
 */
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No images provided.');
  }

  const urls = req.files.map((file) => ({
    url: file.location || `/uploads/${file.filename}`, // S3 public URL or local static URL
    key: file.key || file.filename,                   // Object key or local filename
  }));

  res.status(201).json({ success: true, count: urls.length, images: urls });
});

/**
 * @desc  Delete an image from AWS S3 by its key
 * @route DELETE /api/upload
 * @access Private/Admin
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { key } = req.body;

  if (!key) {
    res.status(400);
    throw new Error('Image key is required.');
  }

  await deleteFromS3(key);

  res.json({ success: true, message: 'Image deleted from S3 successfully.' });
});

module.exports = { uploadImages, deleteImage };
