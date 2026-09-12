/**
 * AURA Backend — Audit Route
 *
 * GET /api/v1/tasks/:taskId/audit — Get audit trail
 *
 * Source: docs/03-API-CONTRACT.md §6.7
 * Authentication required.
 */

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const taskModel = require('../models/taskModel');
const auditService = require('../services/auditService');
const { success, error } = require('../utils/response');
const { ERROR_CODES } = require('../../../shared/errorCodes');

const router = express.Router();

const taskIdParamSchema = Joi.object({
  taskId: Joi.string().uuid().required(),
});

/**
 * GET /api/v1/tasks/:taskId/audit
 * Returns chronological audit trail for a task.
 */
router.get(
  '/:taskId/audit',
  authMiddleware,
  validate(taskIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      // Verify task ownership
      const task = await taskModel.findById(req.params.taskId, req.user.userId);
      if (!task) {
        return error(
          res,
          ERROR_CODES.TASK_NOT_FOUND.code,
          'Task not found',
          ERROR_CODES.TASK_NOT_FOUND.httpStatus
        );
      }

      const entries = await auditService.getByTaskId(req.params.taskId);
      return success(res, { entries });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
