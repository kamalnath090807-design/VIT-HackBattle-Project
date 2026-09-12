/**
 * AURA Backend — Approval Service
 *
 * Handles the approval workflow:
 * 1. Agent calls requestApproval() → backend writes approval to DB, pauses agent
 * 2. User submits decision via POST /tasks/:id/approve → backend records, resumes agent
 *
 * Source: docs/11-INTEGRATION-CONTRACT.md §7.2, docs/03-API-CONTRACT.md §6.5
 */

const approvalModel = require('../models/approvalModel');
const taskModel = require('../models/taskModel');
const stepModel = require('../models/stepModel');
const auditService = require('./auditService');
const { TASK_STATES } = require('../../../shared/taskStates');
const { STEP_STATUSES } = require('../../../shared/stepStatuses');
const { AUDIT_ACTIONS } = require('../../../shared/auditActions');
const logger = require('../utils/logger');

// In-memory map of pending approval promises.
// Key: `${taskId}:${stepIndex}`, Value: { resolve }
// The agent's execution is paused waiting for this promise to resolve.
const pendingApprovals = new Map();

/**
 * Called by the agent (via agentAdapter's requestApproval callback)
 * when a HIGH-risk step needs user approval.
 *
 * Sets task status to AWAITING_APPROVAL, writes to DB,
 * and returns a Promise that resolves when the user submits their decision.
 *
 * @param {string} taskId
 * @param {Object} approvalRequest - From 11-INTEGRATION-CONTRACT §7.2
 * @param {number} approvalRequest.stepIndex
 * @param {string} approvalRequest.tool
 * @param {Object} approvalRequest.params
 * @param {string} approvalRequest.riskLevel
 * @param {string} approvalRequest.reason
 * @returns {Promise<{decision: string, reason: string}>}
 */
async function handleAgentApprovalRequest(taskId, approvalRequest) {
  const { stepIndex, tool, params, riskLevel, reason } = approvalRequest;

  // 1. Update task status to AWAITING_APPROVAL
  await taskModel.updateStatus(taskId, TASK_STATES.AWAITING_APPROVAL, {
    current_step_index: stepIndex,
  });

  // 2. Write approval record to DB
  await approvalModel.create(taskId, stepIndex);

  // 3. Write audit entry
  await auditService.log(
    taskId,
    AUDIT_ACTIONS.APPROVAL_REQUESTED,
    { tool, params, riskLevel, reason },
    stepIndex
  );

  logger.info('ApprovalService', `Approval requested for task ${taskId}, step ${stepIndex}`, {
    tool,
    riskLevel,
  });

  // 4. Return a promise that will be resolved when the user submits their decision
  return new Promise((resolve) => {
    const key = `${taskId}:${stepIndex}`;
    pendingApprovals.set(key, { resolve });
  });
}

/**
 * Called when the user submits their approval decision via POST /tasks/:id/approve.
 *
 * @param {string} taskId
 * @param {number} stepIndex
 * @param {string} decision - 'APPROVED' or 'REJECTED'
 * @param {string|null} reason
 * @param {string} userId
 * @returns {Promise<Object>} Updated approval record
 */
async function submitDecision(taskId, stepIndex, decision, reason, userId) {
  // 1. Validate the task belongs to the user and is awaiting approval
  const task = await taskModel.findById(taskId, userId);
  if (!task) {
    const err = new Error('Task not found');
    err.errorCode = 'TASK_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  if (task.status !== TASK_STATES.AWAITING_APPROVAL) {
    const err = new Error(`Task is not awaiting approval (current: ${task.status})`);
    err.errorCode = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  // 2. Find the pending approval record
  const approval = await approvalModel.findPending(taskId, stepIndex);
  if (!approval) {
    const err = new Error('No pending approval found for this step');
    err.errorCode = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  // 3. Record the decision
  const updated = await approvalModel.updateDecision(approval.id, decision, reason);

  // 4. Write audit entry
  const auditAction =
    decision === 'APPROVED' ? AUDIT_ACTIONS.APPROVAL_GRANTED : AUDIT_ACTIONS.APPROVAL_DENIED;
  await auditService.log(taskId, auditAction, { decision, reason }, stepIndex);

  // 5. Resume agent execution by resolving the pending promise
  const key = `${taskId}:${stepIndex}`;
  const pending = pendingApprovals.get(key);
  if (pending) {
    pending.resolve({ decision, reason: reason || null });
    pendingApprovals.delete(key);
  }

  // 6. Update task status based on decision
  if (decision === 'APPROVED') {
    await taskModel.updateStatus(taskId, TASK_STATES.EXECUTING);
  } else {
    await taskModel.updateStatus(taskId, TASK_STATES.CANCELLED, {
      completed_at: new Date().toISOString(),
    });
    await auditService.log(taskId, AUDIT_ACTIONS.TASK_CANCELLED, {
      reason: 'User rejected approval',
    });
  }

  return updated;
}

module.exports = {
  handleAgentApprovalRequest,
  submitDecision,
};
