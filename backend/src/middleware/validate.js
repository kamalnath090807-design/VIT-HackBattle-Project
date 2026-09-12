/**
 * AURA Backend — Input Validation Middleware
 *
 * Generic Joi validation middleware factory.
 * Returns 400 VALIDATION_ERROR with details on failure.
 * Source: docs/03-API-CONTRACT.md §4
 */

const { error } = require('../utils/response');
const { ERROR_CODES } = require('../../../shared/errorCodes');

/**
 * Create a validation middleware for a specific Joi schema.
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Which part of the request to validate
 * @returns {import('express').RequestHandler}
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error: validationError, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validationError) {
      const details = validationError.details.map((d) => d.message).join('; ');
      return error(
        res,
        ERROR_CODES.VALIDATION_ERROR.code,
        details,
        ERROR_CODES.VALIDATION_ERROR.httpStatus
      );
    }

    // Replace with validated (and stripped) value
    req[source] = value;
    next();
  };
}

module.exports = { validate };
