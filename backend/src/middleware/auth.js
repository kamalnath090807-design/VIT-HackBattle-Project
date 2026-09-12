/**
 * AURA Backend — Authentication Middleware
 *
 * JWT validation via Supabase Auth.
 * Source: docs/08-SECURITY.md §3
 *
 * Extracts Bearer token, validates via Supabase, attaches req.user.
 * Auth scope follows the approved ADR — no invented bypass mechanisms.
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('../config');
const { error } = require('../utils/response');
const { ERROR_CODES } = require('../../../shared/errorCodes');

/**
 * Express middleware: validates JWT and attaches req.user = { userId }.
 * Returns 401 AUTH_REQUIRED on failure.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(
      res,
      ERROR_CODES.AUTH_REQUIRED.code,
      'Authentication required',
      ERROR_CODES.AUTH_REQUIRED.httpStatus
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  if (!token) {
    return error(
      res,
      ERROR_CODES.AUTH_REQUIRED.code,
      'Authentication required',
      ERROR_CODES.AUTH_REQUIRED.httpStatus
    );
  }

  // Create a Supabase client scoped to this user's token for auth validation
  const supabaseAuth = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  supabaseAuth.auth
    .getUser(token)
    .then(({ data, error: authError }) => {
      if (authError || !data?.user) {
        return error(
          res,
          ERROR_CODES.AUTH_REQUIRED.code,
          'Invalid or expired authentication token',
          ERROR_CODES.AUTH_REQUIRED.httpStatus
        );
      }

      // Attach authenticated user info to request
      req.user = {
        userId: data.user.id,
        email: data.user.email,
      };

      next();
    })
    .catch(() => {
      return error(
        res,
        ERROR_CODES.AUTH_REQUIRED.code,
        'Authentication validation failed',
        ERROR_CODES.AUTH_REQUIRED.httpStatus
      );
    });
}

module.exports = { authMiddleware };
