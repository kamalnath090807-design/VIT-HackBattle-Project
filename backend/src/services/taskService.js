/**
 * AURA Backend — Task Service
 *
 * Task lifecycle management. Coordinates between API routes, database models,
 * audit logging, and the agent integration adapter.
 *
 * Source: docs/03-API-CONTRACT.md §6.1–6.5
 *
 * This service does NOT contain:
 * - Policy evaluation (owned by agent/policyEngine.js)
 * - Planning logic (owned by agent/planner.js)
 * - Tool execution (owned by agent/toolRouter.js)
 * - LLM calls (owned by agent/providers/)
 */

const taskModel = require('../models/taskModel');
const stepModel = require('../models/stepModel');
const auditService = require('./auditService');
const agentAdapter = require('../integration/agentAdapter');
const { TASK_STATES, isTerminalState } = require('../../../shared/taskStates');
const { AUDIT_ACTIONS } = require('../../../shared/auditActions');
const { config } = require('../config');
const logger = require('../utils/logger');

/**
 * Create a new task and trigger agent execution.
 * @param {string} userId
 * @param {string} goal
 * @returns {Promise<Object>} Created task
 */
async function createTask(userId, goal) {
  // 1. Create task in DB with QUEUED status
  const task = await taskModel.create(userId, goal);

  // 2. Write audit entry
  await auditService.log(task.id, AUDIT_ACTIONS.TASK_CREATED, { goal });

  // 3. Trigger agent execution asynchronously (don't block the response)
  setImmediate(() => {
    runAgentExecution(task.id, userId, goal).catch((err) => {
      logger.error('TaskService', `Background agent execution failed: ${task.id}`, err);
    });
  });

  return task;
}

/**
 * Run agent execution in the background.
 * Persists results back to DB when complete.
 * @param {string} taskId
 * @param {string} userId
 * @param {string} goal
 */
async function runAgentExecution(taskId, userId, goal) {
  try {
    // Update status to PLANNING
    await taskModel.updateStatus(taskId, TASK_STATES.PLANNING);

    // Build the approval callback that the agent will call for HIGH-risk steps
    const requestApprovalCallback = async (approvalRequest) => {
      // This is called by the agent when a step needs user approval.
      // The approvalService handles writing to DB and waiting for user decision.
      const approvalService = require('./approvalService');
      return approvalService.handleAgentApprovalRequest(taskId, approvalRequest);
    };

    // Call agent orchestrator via the integration adapter
    const result = await agentAdapter.executeTask(
      {
        taskId,
        goal,
        userId,
        maxSteps: config.maxStepsPerTask,
        timeout: config.taskTimeoutMs,
      },
      requestApprovalCallback
    );

    // Persist the agent's execution result
    await persistAgentResult(taskId, result);
  } catch (err) {
    logger.error('TaskService', `Agent execution error for task ${taskId}`, err);
    await taskModel.updateStatus(taskId, TASK_STATES.FAILED, {
      completed_at: new Date().toISOString(),
    });
    await auditService.log(taskId, AUDIT_ACTIONS.TASK_FAILED, {
      error: err.message,
    });
  }
}

/**
 * Persist the agent's ExecuteTaskResult to the database.
 * @param {string} taskId
 * @param {Object} agentResult - ExecuteTaskResult from 11-INTEGRATION-CONTRACT §7.1
 */
async function persistAgentResult(taskId, agentResult) {
  // 1. Store plan steps
  if (agentResult.plan?.steps?.length > 0) {
    await stepModel.bulkInsert(taskId, agentResult.plan.steps);
    await taskModel.updatePlan(taskId, agentResult.plan);
  }

  // 2. Bulk-write audit entries from agent
  if (agentResult.auditEntries?.length > 0) {
    const entries = agentResult.auditEntries.map((entry) => ({
      taskId,
      action: entry.action,
      details: entry.details || {},
      stepIndex: entry.stepIndex,
      timestamp: entry.timestamp,
    }));
    await auditService.bulkLog(entries);
  }

  // 3. Update final task status and result
  const finalStatus = agentResult.status || TASK_STATES.FAILED;
  const completedAt = isTerminalState(finalStatus) ? new Date().toISOString() : null;

  await taskModel.updateStatus(taskId, finalStatus, {
    completed_at: completedAt,
  });

  if (agentResult.result) {
    await taskModel.updateResult(taskId, agentResult.result, completedAt);
  }
}

/**
 * Get a single task with its steps.
 * @param {string} taskId
 * @param {string} userId
 * @returns {Promise<Object|null>} Task with plan and steps, or null
 */
async function getTask(taskId, userId) {
  const task = await taskModel.findById(taskId, userId);
  if (!task) return null;

  const steps = await stepModel.findByTaskId(taskId);
  return { ...task, steps };
}

/**
 * List tasks for a user with pagination and optional status filter.
 * @param {string} userId
 * @param {Object} filters
 * @param {string} [filters.status]
 * @param {number} [filters.limit=20]
 * @param {number} [filters.offset=0]
 * @returns {Promise<{tasks: Object[], total: number, limit: number, offset: number}>}
 */
async function listTasks(userId, { status, limit = 20, offset = 0 } = {}) {
  const result = await taskModel.findByUserId(userId, { status, limit, offset });
  return {
    tasks: result.tasks,
    total: result.total,
    limit,
    offset,
  };
}

/**
 * Cancel a task. Validates the task is not already in a terminal state.
 * @param {string} taskId
 * @param {string} userId
 * @returns {Promise<Object>} Updated task
 * @throws {Error} If task not found or already terminal
 */
async function cancelTask(taskId, userId) {
  const task = await taskModel.findById(taskId, userId);

  if (!task) {
    const err = new Error('Task not found');
    err.errorCode = 'TASK_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (isTerminalState(task.status)) {
    const err = new Error(`Cannot cancel task in terminal state: ${task.status}`);
    err.errorCode = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const updated = await taskModel.updateStatus(taskId, TASK_STATES.CANCELLED, {
    completed_at: new Date().toISOString(),
  });

  await auditService.log(taskId, AUDIT_ACTIONS.TASK_CANCELLED, {
    previousStatus: task.status,
  });

  return updated;
}

module.exports = {
  createTask,
  getTask,
  listTasks,
  cancelTask,
  persistAgentResult,
};
