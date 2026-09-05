/**
 * middleware/auth.middleware.js
 * Firebase ID Token authentication middleware.
 * Frontend sends: Authorization: Bearer <firebase-id-token>
 * Backend verifies with Firebase Admin SDK and attaches req.user.
 */

const asyncHandler = require('express-async-handler');
const { auth, db } = require('../config/firebase');

/**
 * protect - Requires a valid Firebase ID Token.
 * Attaches req.user = { uid, name, email, phone, role, addresses, ... } on success.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - no token provided.');
  }

  try {
    // Verify the Firebase ID token
    const decoded = await auth.verifyIdToken(token);

    // Fetch the user profile from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      res.status(401);
      throw new Error('Not authorized - user profile not found.');
    }

    req.user = { uid: decoded.uid, ...userDoc.data() };
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized - token is invalid or expired.');
  }
});

/**
 * adminOnly - Must be used AFTER protect. Ensures user is an admin.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  throw new Error('Access denied - admin only.');
};

/**
 * optionalAuth - Continues even without a token. Useful for public routes.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (userDoc.exists) {
      req.user = { uid: decoded.uid, ...userDoc.data() };
    }
  } catch (_err) {
    req.user = null;
  }

  next();
});

module.exports = { protect, adminOnly, optionalAuth };
