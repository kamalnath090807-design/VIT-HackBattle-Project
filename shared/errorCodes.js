/**
 * AURA — Canonical Error Codes
 *
 * Source of truth: docs/03-API-CONTRACT.md §4
 * Integration contract: docs/11-INTEGRATION-CONTRACT.md §6 
 *
 * ALL modules import from this file.
 * No module defines its own error code constants.
 */

const ERROR_CODES = Object.freeze({
  AUTH_REQUIRED: { code: 'AUTH_REQUIRED', httpStatus: 401 },
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', httpStatus: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', httpStatus: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', httpStatus: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', httpStatus: 400 },
  RATE_LIMITED: { code: 'RATE_LIMITED', httpStatus: 429 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', httpStatus: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', httpStatus: 503 },
  TASK_NOT_FOUND: { code: 'TASK_NOT_FOUND', httpStatus: 404 },
  TOOL_EXECUTION_FAILED: { code: 'TOOL_EXECUTION_FAILED', httpStatus: 500 },
  LLM_PROVIDER_ERROR: { code: 'LLM_PROVIDER_ERROR', httpStatus: 503 },
  APPROVAL_REQUIRED: { code: 'APPROVAL_REQUIRED', httpStatus: 202 },
});

module.exports = {
  ERROR_CODES,
};
