/**
 * Async Handler Middleware
 * 
 * This utility function wraps async route handlers to automatically
 * catch and forward errors to the error handler middleware.
 * 
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     // async code here
 *   }));
 */

/**
 * Wraps an async function to catch errors
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

