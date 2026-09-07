/**
 * routes/cms.routes.js
 * Express routes for Krishna Enterprises Homepage CMS.
 */

const express = require('express');
const router = express.Router();
const {
  getPublishedHomepage,
  getDraftHomepage,
  saveDraftHomepage,
  publishHomepage,
  resetToDefault,
  getVersions,
  rollbackVersion,
} = require('../controllers/cms.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

// Public - Active homepage for customers
router.get('/homepage', getPublishedHomepage);

// Admin Only - CMS Draft, Reordering, Publishing, and Rollback
router.get('/homepage/draft', protect, adminOnly, getDraftHomepage);
router.put('/homepage/draft', protect, adminOnly, saveDraftHomepage);
router.post('/homepage/publish', protect, adminOnly, publishHomepage);
router.post('/homepage/reset', protect, adminOnly, resetToDefault);
router.get('/homepage/versions', protect, adminOnly, getVersions);
router.post('/homepage/rollback/:versionId', protect, adminOnly, rollbackVersion);

module.exports = router;
