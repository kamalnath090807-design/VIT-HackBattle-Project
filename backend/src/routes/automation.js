/**
 * AURA Backend — Automation, Telemetry & Productivity Routes
 *
 * Exposes live PC system metrics, Android device telemetry,
 * user memory profile, and productivity briefing endpoints.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { pcEngine } = require('../../../agent/src/automation/pcEngine');
const { phoneEngine } = require('../../../agent/src/automation/phoneEngine');
const { memoryEngine } = require('../../../agent/src/automation/memoryEngine');
const { productivityEngine } = require('../../../agent/src/automation/productivityEngine');

const router = express.Router();

/**
 * GET /api/v1/automation/system
 * Returns live PC CPU load, RAM usage, Disk space, and Battery.
 */
router.get('/system', authMiddleware, async (req, res, next) => {
  try {
    const metrics = await pcEngine.getSystemMetrics();
    return success(res, metrics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/automation/mobile
 * Returns Android device battery, temperature, charging state, and ADB endpoint.
 */
router.get('/mobile', authMiddleware, async (req, res, next) => {
  try {
    const battery = await phoneEngine.getBattery();
    return success(res, {
      ...battery,
      adbEndpoint: `${phoneEngine.config?.device?.host || '192.168.1.100'}:${phoneEngine.config?.device?.port || 5555}`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/automation/memory
 * Returns user profile, learned habits, and remembered facts.
 */
router.get('/memory', authMiddleware, async (req, res, next) => {
  try {
    const profile = memoryEngine.getUserProfile();
    return success(res, profile);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/automation/memory/fact
 * Store a discreet fact into persistent memory.
 */
router.post('/memory/fact', authMiddleware, async (req, res, next) => {
  try {
    const { key, fact } = req.body;
    if (!key || !fact) {
      return error(res, 'INVALID_INPUT', 'Both key and fact are required', 400);
    }
    memoryEngine.storeFact(key, fact);
    return success(res, { key, fact, stored: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/automation/productivity
 * Returns aggregated daily briefing (Weather + Habits + Notes + Battery).
 */
router.get('/productivity', authMiddleware, async (req, res, next) => {
  try {
    const brief = await productivityEngine.generateDailyBrief();
    return success(res, brief);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/automation/productivity/expense
 * Log an expense and retrieve updated monthly total.
 */
router.post('/productivity/expense', authMiddleware, async (req, res, next) => {
  try {
    const { amount, description, category } = req.body;
    if (!amount || !description) {
      return error(res, 'INVALID_INPUT', 'Amount and description are required', 400);
    }
    const result = productivityEngine.logExpense(amount, description, category);
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
