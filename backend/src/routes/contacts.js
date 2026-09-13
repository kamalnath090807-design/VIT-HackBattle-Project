/**
 * AURA Backend — Contacts Routes
 *
 * GET  /api/v1/contacts         — List user's contacts
 * POST /api/v1/contacts         — Create or import contact
 * GET  /api/v1/contacts/resolve — Resolve name to verified channels
 *
 * Source: Implementation Plan
 */

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const contactService = require('../services/contactService');
const { success, error } = require('../utils/response');

const router = express.Router();

const createContactSchema = Joi.object({
  displayName: Joi.string().min(1).max(255).required(),
  aliases: Joi.array().items(Joi.string().max(255)).optional(),
  identities: Joi.array().items(
    Joi.object({
      channel: Joi.string().valid('whatsapp', 'email', 'sms').required(),
      value: Joi.string().required(),
      provider: Joi.string().optional(),
      verificationStatus: Joi.string().valid('verified', 'unverified', 'stale').optional(),
      source: Joi.string().valid('user_import', 'authorized_email', 'authorized_contact_provider').optional(),
    })
  ).optional(),
});

const resolveQuerySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
});

/**
 * GET /api/v1/contacts
 * List all contacts for the authenticated user.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const contacts = await contactService.listContacts(req.user.userId);
    return success(res, { contacts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/contacts/resolve
 * Resolve natural language contact name to verified channels.
 */
router.get('/resolve', authMiddleware, validate(resolveQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await contactService.resolveContact(req.user.userId, req.query.name);
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/contacts
 * Create or import a contact.
 */
router.post('/', authMiddleware, validate(createContactSchema), async (req, res, next) => {
  try {
    const created = await contactService.createContact(req.user.userId, req.body);
    return success(res, { contact: created }, 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
