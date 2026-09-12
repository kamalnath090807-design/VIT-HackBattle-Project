/**
 * AURA Backend — Tools Route
 *
 * GET /api/v1/tools — List registered tools
 *
 * Source: docs/03-API-CONTRACT.md §6.8
 * Owner: Abishek / Bala (route is backend, data comes from agent registry)
 *
 * This route does NOT maintain its own tool list.
 * Tool definitions are sourced from Bala's agent/src/toolRegistry.js
 * via the agent integration adapter.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const agentAdapter = require('../integration/agentAdapter');
const { success } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/v1/tools
 * Returns all registered tools from the agent's tool registry.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const tools = await agentAdapter.getAvailableTools();
    return success(res, { tools });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
