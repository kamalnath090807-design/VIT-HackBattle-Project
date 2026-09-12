/**
 * AURA Backend — Global Error Handler
 *
 * Catches all unhandled errors and returns the documented error format.
 * Source: docs/03-API-CONTRACT.md §4, docs/11-INTEGRATION-CONTRACT.md §6
 *
 * Never exposes stack traces or secrets in responses.
 */

const logger = require('../utils/logger');
const { ERROR_CODES } = require('../../../shared/errorCodes');

/**
 * Express error-handling middleware (4-argument signature).
 */
function errorHandler(err, req, res, _next) {
  // Log the full error server-side (stack trace included)
  logger.error('ErrorHandler', err.message || 'Unhandled error', err);

  // Determine error code and status
  const code = err.errorCode || ERROR_CODES.INTERNAL_ERROR.code;
  const statusCode = err.statusCode || ERROR_CODES.INTERNAL_ERROR.httpStatus;
  const message =
    res.statusCode === 500 || statusCode === 500
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  // Never send stack traces to the client
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

module.exports = { errorHandler };
