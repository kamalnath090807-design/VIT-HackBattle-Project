/**
 * AURA Backend — Agent Integration Adapter
 *
 * SINGLE POINT OF CONTACT between backend and agent module.
 * Implements the interface from docs/11-INTEGRATION-CONTRACT.md §7.
 *
 * When Bala's agent/ module is ready, this adapter imports from it.
 * Until then, it uses the temporary stub (agentStub.js).
 *
 * This file does NOT contain:
 * - Planning logic
 * - Policy evaluation
 * - Tool execution
 * - LLM calls
 */

const logger = require('../utils/logger');

// ─── Import source: Production Agent Module ───
const { executeTask: agentExecuteTask, getAvailableTools: agentGetTools } = require('../../../agent/src/orchestrator');
// ────────────────────────────────────────────────

/**
 * Execute a task through the agent orchestrator.
 *
 * @param {Object} input - ExecuteTaskInput per 11-INTEGRATION-CONTRACT §7.1
 * @param {string} input.taskId
 * @param {string} input.goal
 * @param {string} input.userId
 * @param {number} [input.maxSteps=10]
 * @param {number} [input.timeout=300000]
 * @param {Function} requestApprovalCallback - Called by agent when HIGH-risk step needs approval
 * @param {Object} [callbacks] - Streaming step callbacks (onPlanReady, onStepStart, onStepComplete)
 * @returns {Promise<Object>} ExecuteTaskResult per 11-INTEGRATION-CONTRACT §7.1
 */
async function executeTask(input, requestApprovalCallback, callbacks = {}) {
  logger.info('AgentAdapter', `Initiating task execution: ${input.taskId}`, {
    goal: input.goal.substring(0, 100), // Truncate for logging
  });

  try {
    const result = await agentExecuteTask({
      taskId: input.taskId,
      goal: input.goal,
      userId: input.userId,
      maxSteps: input.maxSteps || 10,
      timeout: input.timeout || 300000,
    }, requestApprovalCallback, callbacks);

    logger.info('AgentAdapter', `Task execution completed: ${input.taskId}`, {
      status: result.status,
      stepsCount: result.plan?.steps?.length || 0,
    });

    return result;
  } catch (err) {
    logger.error('AgentAdapter', `Task execution failed: ${input.taskId}`, err);
    throw err;
  }
}

/**
 * Get available tools from the agent's tool registry.
 * Used by GET /api/v1/tools — backend does NOT maintain its own tool list.
 *
 * @returns {Promise<Object[]>} Array of tool definitions
 */
async function getAvailableTools() {
  try {
    return await agentGetTools();
  } catch (err) {
    logger.error('AgentAdapter', 'Failed to retrieve tools from agent registry', err);
    return [];
  }
}

module.exports = { executeTask, getAvailableTools };
