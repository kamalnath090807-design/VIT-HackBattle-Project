/**
 * AURA Backend — Auth Routes
 *
 * POST /api/v1/auth/register — Create user
 * POST /api/v1/auth/login — Login, return JWT
 *
 * Source: docs/03-API-CONTRACT.md §6.6 (Auth endpoints)
 * No authentication required on these endpoints.
 */

const express = require('express');
const Joi = require('joi');
const { getSupabase } = require('../config/supabase');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const { ERROR_CODES } = require('../../../shared/errorCodes');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * POST /api/v1/auth/register
 * Creates a new user via Supabase Auth.
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for hackathon
    });

    if (authError) {
      logger.warn('AuthRoute', `Registration failed: ${authError.message}`, { email });
      return error(
        res,
        ERROR_CODES.VALIDATION_ERROR.code,
        authError.message,
        ERROR_CODES.VALIDATION_ERROR.httpStatus
      );
    }

    logger.info('AuthRoute', `User registered: ${data.user.id}`, { email });

    return success(
      res,
      {
        userId: data.user.id,
        email: data.user.email,
      },
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticates user and returns JWT.
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error: authError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.warn('AuthRoute', `Login failed: ${authError.message}`, { email });
      return error(
        res,
        ERROR_CODES.INVALID_CREDENTIALS.code,
        'Invalid email or password',
        ERROR_CODES.INVALID_CREDENTIALS.httpStatus
      );
    }

    logger.info('AuthRoute', `User logged in: ${data.user.id}`, { email });

    return success(res, {
      token: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
