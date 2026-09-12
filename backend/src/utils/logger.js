/**
 * AURA Backend — Structured Logger
 *
 * Console-based logging per docs/07-DEPLOYMENT.md §13.
 * Never logs secrets, tokens, or full request bodies with sensitive data.
 */

/**
 * Log an informational message.
 * @param {string} context - Where the log originates (e.g., 'TaskService', 'AuthMiddleware')
 * @param {string} message
 * @param {Object} [meta] - Additional structured data (never include secrets)
 */
function info(context, message, meta = {}) {
  console.log(JSON.stringify({
    level: 'info',
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}

/**
 * Log a warning.
 * @param {string} context
 * @param {string} message
 * @param {Object} [meta]
 */
function warn(context, message, meta = {}) {
  console.warn(JSON.stringify({
    level: 'warn',
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}

/**
 * Log an error. Includes stack trace but never secrets.
 * @param {string} context
 * @param {string} message
 * @param {Error|Object} [err]
 */
function logError(context, message, err = {}) {
  console.error(JSON.stringify({
    level: 'error',
    context,
    message,
    timestamp: new Date().toISOString(),
    error: err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err,
  }));
}

module.exports = { info, warn, error: logError };
