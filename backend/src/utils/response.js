/**
 * AURA Backend — Response Helpers
 *
 * Formats all API responses to match docs/03-API-CONTRACT.md §4.
 * Uses error codes from shared/errorCodes.js — never redefines them.
 */

const { ERROR_CODES } = require('../../../shared/errorCodes');

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {number} [statusCode=200]
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code - Error code from shared/errorCodes.js
 * @param {string} message - Human-readable description
 * @param {number} [statusCode] - HTTP status (auto-detected from ERROR_CODES if omitted)
 */
function error(res, code, message, statusCode) {
  // Auto-detect HTTP status from shared error codes
  if (!statusCode) {
    const errorDef = Object.values(ERROR_CODES).find((e) => e.code === code);
    statusCode = errorDef ? errorDef.httpStatus : 500;
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

module.exports = { success, error };
