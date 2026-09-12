/**
 * AURA Backend — Temporary Agent Stub
 *
 * TEMPORARY STUB — replaced by real agent/ module when available.
 *
 * Implements ONLY the executeTask() and getAvailableTools() interface
 * from docs/11-INTEGRATION-CONTRACT.md §7.
 *
 * Does NOT re-implement planning, policy, tool execution, or LLM calls.
 * Returns canned ExecuteTaskResult data with simulated delays.
 *
 * Swap instructions:
 *   In agentAdapter.js, change the require() from './agentStub' to
 *   '../../../agent/src/orchestrator'
 */

const { v4: uuidv4 } = require('uuid');
const { TASK_STATES } = require('../../../shared/taskStates');
const { STEP_STATUSES } = require('../../../shared/stepStatuses');
const { AUDIT_ACTIONS } = require('../../../shared/auditActions');

/**
 * Stub implementation of executeTask.
 * Simulates a 2-step plan with short delays.
 * @param {Object} input - ExecuteTaskInput
 * @param {Function} _requestApproval - Approval callback (unused in stub)
 * @returns {Promise<Object>} ExecuteTaskResult
 */
async function executeTask(input, _requestApproval) {
  // Simulate processing delay
  await delay(1500);

  const now = new Date().toISOString();

  return {
    status: TASK_STATES.COMPLETED,
    plan: {
      steps: [
        {
          stepIndex: 0,
          description: `Analyze goal: "${input.goal.substring(0, 60)}..."`,
          tool: 'stub_analyzer',
          params: { query: input.goal },
          riskLevel: 'LOW',
          status: STEP_STATUSES.COMPLETED,
          result: {
            analysis: 'Goal parsed and validated by stub orchestrator',
            confidence: 0.95,
          },
          error: null,
          startedAt: now,
          completedAt: now,
        },
        {
          stepIndex: 1,
          description: 'Generate summary response',
          tool: 'stub_responder',
          params: { format: 'text' },
          riskLevel: 'LOW',
          status: STEP_STATUSES.COMPLETED,
          result: {
            output: `Stub result for: ${input.goal}`,
          },
          error: null,
          startedAt: now,
          completedAt: now,
        },
      ],
    },
    result: {
      summary: `[STUB] Task completed for goal: "${input.goal.substring(0, 80)}"`,
      evidence: { source: 'agent-stub', note: 'Replace with real agent module' },
      verified: true,
    },
    auditEntries: [
      { action: AUDIT_ACTIONS.PLAN_GENERATED, details: { stepsCount: 2, source: 'stub' }, timestamp: now },
      { action: AUDIT_ACTIONS.STEP_STARTED, details: { stepIndex: 0, tool: 'stub_analyzer' }, timestamp: now },
      { action: AUDIT_ACTIONS.TOOL_EXECUTED, details: { stepIndex: 0, tool: 'stub_analyzer', success: true }, timestamp: now },
      { action: AUDIT_ACTIONS.STEP_COMPLETED, details: { stepIndex: 0 }, timestamp: now },
      { action: AUDIT_ACTIONS.STEP_STARTED, details: { stepIndex: 1, tool: 'stub_responder' }, timestamp: now },
      { action: AUDIT_ACTIONS.TOOL_EXECUTED, details: { stepIndex: 1, tool: 'stub_responder', success: true }, timestamp: now },
      { action: AUDIT_ACTIONS.STEP_COMPLETED, details: { stepIndex: 1 }, timestamp: now },
      { action: AUDIT_ACTIONS.TASK_COMPLETED, details: { source: 'stub' }, timestamp: now },
    ],
    error: null,
  };
}

/**
 * Stub implementation of getAvailableTools.
 * Returns a sample tool list matching the API contract response format.
 * @returns {Promise<Object[]>}
 */
async function getAvailableTools() {
  return [
    {
      name: 'weather_api',
      description: 'Fetch current weather data for a city',
      parameters: {
        city: { type: 'string', required: true, description: 'City name' },
      },
      riskLevel: 'LOW',
    },
    {
      name: 'github_issues',
      description: 'Fetch issues from a GitHub repository',
      parameters: {
        owner: { type: 'string', required: true },
        repo: { type: 'string', required: true },
        state: { type: 'string', required: false, default: 'open' },
      },
      riskLevel: 'LOW',
    },
    {
      name: 'github_create_issue',
      description: 'Create a new issue in a GitHub repository',
      parameters: {
        owner: { type: 'string', required: true },
        repo: { type: 'string', required: true },
        title: { type: 'string', required: true },
        body: { type: 'string', required: false },
      },
      riskLevel: 'HIGH',
    },
    {
      name: 'calculator',
      description: 'Perform basic arithmetic calculations',
      parameters: {
        expression: { type: 'string', required: true, description: 'Math expression' },
      },
      riskLevel: 'LOW',
    },
  ];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { executeTask, getAvailableTools };
