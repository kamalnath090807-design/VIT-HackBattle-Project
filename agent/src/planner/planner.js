/**
 * AURA Agent — Planner Module
 *
 * Source: docs/02-ARCHITECTURE.md §3, docs/11-INTEGRATION-CONTRACT.md §7
 *
 * Decomposes high-level user goals into structured, bounded execution plans.
 * Enforces maximum step count (10) and verifies plan schema.
 */

const { defaultFactory } = require('../providers/providerFactory');
const { listPublicTools } = require('../tools/toolRegistry');

class Planner {
  constructor(options = {}) {
    this.providerFactory = options.providerFactory || defaultFactory;
    this.maxSteps = options.maxSteps || 10;
  }

  /**
   * Generate an execution plan from a user goal.
   *
   * @param {Object} input
   * @param {string} input.goal - User goal
   * @param {string} [input.taskId]
   * @param {Function} [onAuditRecord]
   * @returns {Promise<{
   *   steps: Array<Object>,
   *   estimatedRisk: string,
   *   providerUsed: string,
   *   modelUsed: string
   * }>}
   */
  async plan(input, onAuditRecord) {
    const tools = listPublicTools();
    const planRequest = {
      taskId: input.taskId,
      goal: input.goal,
      tools,
      maxSteps: this.maxSteps,
      attachment: input.attachment || null,
      target: input.target || 'pc',
    };

    const normalizedResult = await this.providerFactory.generatePlanWithFailover(
      planRequest,
      onAuditRecord
    );

    const steps = (normalizedResult.plan?.steps || []).slice(0, this.maxSteps);

    // Validate step integrity
    if (steps.length === 0) {
      throw new Error('Planner generated empty plan');
    }

    const validatedSteps = steps.map((step, idx) => ({
      stepIndex: idx,
      tool: step.tool,
      parameters: step.parameters || {},
      reason: step.reason || `Execute step ${idx + 1}`,
      expectedOutcome: step.expectedOutcome || 'Step execution result',
    }));

    return {
      steps: validatedSteps,
      estimatedRisk: normalizedResult.plan?.estimatedRisk || 'LOW',
      providerUsed: normalizedResult.provider,
      modelUsed: normalizedResult.model,
      setupName: normalizedResult.plan?.setupName,
      isSetup: normalizedResult.plan?.isSetup || false,
      isMultiOpen: normalizedResult.plan?.isMultiOpen || false,
    };
  }
}

const defaultPlanner = new Planner();

module.exports = {
  Planner,
  defaultPlanner,
};
