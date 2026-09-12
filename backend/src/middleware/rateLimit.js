/**
 * AURA Backend — Rate Limiting Middleware
 *
 * Limits task creation to MAX_TASKS_PER_MINUTE per IP.
 * Source: docs/08-SECURITY.md §5
 */

const rateLimit = require('express-rate-limit');
const { config } = require('../config');

/**
 * Rate limiter for task creation endpoint.
 * Returns 429 RATE_LIMITED when exceeded.
 */
const taskCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.maxTasksPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many tasks created. Please wait before trying again.',
      },
    });
  },
});

module.exports = { taskCreationLimiter };
