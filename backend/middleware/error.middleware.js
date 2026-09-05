/**
 * middleware/error.middleware.js
 * Global error handler for the Express app.
 */

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Firebase Auth errors
  if (err.code === 'auth/email-already-exists') {
    statusCode = 400;
    message = 'An account with this email already exists.';
  }

  if (err.code === 'auth/user-not-found') {
    statusCode = 404;
    message = 'User not found.';
  }

  if (err.code === 'auth/invalid-id-token' || err.code === 'auth/id-token-expired') {
    statusCode = 401;
    message = 'Token is invalid or expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
