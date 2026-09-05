/**
 * middleware/admin.middleware.js
 * Role-based access control — restricts routes to admin users only.
 */

const asyncHandler = require('express-async-handler');

/**
 * adminOnly — Must be used AFTER the protect middleware.
 * Throws 403 if the authenticated user is not an admin.
 */
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403);
  throw new Error('Access denied — admin privileges required.');
});

module.exports = { adminOnly };
