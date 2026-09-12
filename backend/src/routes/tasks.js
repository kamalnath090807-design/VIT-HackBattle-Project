/**
 * AURA Backend — Task Routes
 *
 * POST /api/v1/tasks — Create task
 * GET  /api/v1/tasks — List tasks
 * GET  /api/v1/tasks/:taskId — Get task details
 * POST /api/v1/tasks/:taskId/cancel — Cancel task
 * POST /api/v1/tasks/:taskId/approve — Submit approval decision
 *
 * Source: docs/03-API-CONTRACT.md §6.2–6.5
 * All routes require authentication.
 */

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { taskCreationLimiter } = require('../middleware/rateLimit');
const taskService = require('../services/taskService');
const approvalService = require('../services/approvalService');
const { success, error } = require('../utils/response');
const { ERROR_CODES } = require('../../../shared/errorCodes');

const router = express.Router();

// ─── Validation schemas ─────────────────────────────────────────────

const createTaskSchema = Joi.object({
  goal: Joi.string().min(1).max(1000).required(),
});

const listTasksQuerySchema = Joi.object({
  status: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const taskIdParamSchema = Joi.object({
  taskId: Joi.string().uuid().required(),
});

const approveSchema = Joi.object({
  stepIndex: Joi.number().integer().min(0).required(),
  decision: Joi.string().valid('APPROVED', 'REJECTED').required(),
  reason: Joi.string().max(500).optional().allow('', null),
});

// ─── Routes ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/tasks
 * Create a new task.
 */
router.post(
  '/',
  authMiddleware,
  taskCreationLimiter,
  validate(createTaskSchema),
  async (req, res, next) => {
    try {
      const task = await taskService.createTask(req.user.userId, req.body.goal);
      return success(res, { task }, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/tasks
 * List tasks for the authenticated user.
 */
router.get(
  '/',
  authMiddleware,
  validate(listTasksQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await taskService.listTasks(req.user.userId, req.query);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/tasks/:taskId
 * Get a specific task with its steps.
 */
router.get(
  '/:taskId',
  authMiddleware,
  validate(taskIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const task = await taskService.getTask(req.params.taskId, req.user.userId);
      if (!task) {
        return error(
          res,
          ERROR_CODES.TASK_NOT_FOUND.code,
          'Task not found',
          ERROR_CODES.TASK_NOT_FOUND.httpStatus
        );
      }
      return success(res, { task });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tasks/:taskId/cancel
 * Cancel a running task.
 */
router.post(
  '/:taskId/cancel',
  authMiddleware,
  validate(taskIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const task = await taskService.cancelTask(req.params.taskId, req.user.userId);
      return success(res, { task });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tasks/:taskId/approve
 * Submit an approval decision for a task step.
 */
router.post(
  '/:taskId/approve',
  authMiddleware,
  validate(taskIdParamSchema, 'params'),
  validate(approveSchema),
  async (req, res, next) => {
    try {
      const { stepIndex, decision, reason } = req.body;
      const approval = await approvalService.submitDecision(
        req.params.taskId,
        stepIndex,
        decision,
        reason || null,
        req.user.userId
      );
      return success(res, { approval });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
