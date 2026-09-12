/**
 * AURA Backend — Health Route
 *
 * GET /api/v1/health — No authentication required.
 * Source: docs/03-API-CONTRACT.md §6.1
 */

const express = require('express');
const { config } = require('../config');
const { success } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/v1/health
 * Returns server status, active AI provider, and timestamp.
 */
router.get('/', (req, res) => {
  return success(res, {
    status: 'healthy',
    ai_provider: config.aiProvider,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
