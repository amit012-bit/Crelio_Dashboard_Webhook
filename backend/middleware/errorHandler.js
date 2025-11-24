/**
 * Error Handler Middleware
 * 
 * This middleware handles errors in Express routes and provides
 * consistent error responses across the API.
 * 
 * Features:
 * - Centralized error handling
 * - Proper HTTP status codes
 * - Error logging
 * - Development vs production error messages
 */

/**
 * Error handler middleware
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("❌ Error:", err);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  } else if (err.name === "CastError") {
    // Mongoose cast error (invalid ID format)
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.name === "MongoServerError" && err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = "Duplicate entry. This record already exists.";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};

