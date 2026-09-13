/**
 * AURA Agent — Core Orchestrator
 *
 * Source: docs/02-ARCHITECTURE.md §3, docs/11-INTEGRATION-CONTRACT.md §7
 *
 * Coordinates the full autonomous execution lifecycle:
 * Plan -> Policy Check -> Approval (if High Risk) -> Execute -> Observe -> Verify.
 */

const { defaultPlanner } = require('./planner/planner');
const { policyEngine } = require('./policy/policyEngine');
const { defaultToolRouter } = require('./tools/toolRouter');
const { defaultObserver } = require('./observer/observer');
const { defaultReplanner } = require('./replanner/replanner');
const { defaultVerifier } = require('./verifier/verifier');
const { listPublicTools } = require('./tools/toolRegistry');

const { TASK_STATES } = require('../../shared/taskStates');
const { STEP_STATUSES } = require('../../shared/stepStatuses');
const { AUDIT_ACTIONS } = require('../../shared/auditActions');

class Orchestrator {
  constructor(options = {}) {
    this.planner = options.planner || defaultPlanner;
    this.policyEngine = options.policyEngine || policyEngine;
    this.toolRouter = options.toolRouter || defaultToolRouter;
    this.observer = options.observer || defaultObserver;
    this.replanner = options.replanner || defaultReplanner;
    this.verifier = options.verifier || defaultVerifier;
  }

  /**
   * List available tools for frontend/backend.
   */
  getAvailableTools() {
    return listPublicTools();
  }

  /**
   * Execute a task end-to-end.
   *
   * @param {Object} input - ExecuteTaskInput per docs/11-INTEGRATION-CONTRACT §7.1
   * @param {string} input.taskId
   * @param {string} input.goal
   * @param {string} input.userId
   * @param {number} [input.maxSteps=10]
   * @param {number} [input.timeout=300000]
   * @param {Function} requestApprovalCallback - Callback invoked for HIGH-risk steps
   * @param {Object} [callbacks] - Optional streaming progress callbacks (onPlanReady, onStepStart, onStepComplete)
   * @returns {Promise<Object>} ExecuteTaskResult
   */
  async executeTask(input, requestApprovalCallback, callbacks = {}) {
    const { taskId, goal, userId } = input;
    const auditEntries = [];

    const recordAudit = (action, details, stepIndex = null) => {
      auditEntries.push({
        taskId,
        action,
        details: details || {},
        stepIndex,
        timestamp: new Date().toISOString(),
      });
    };

    recordAudit(AUDIT_ACTIONS.TASK_CREATED, { goal, userId });

    try {
      // ─── 1. PLANNING ────────────────────────────────────────────────
      const planResult = await this.planner.plan(
        { taskId, goal },
        (failoverAudit) => {
          auditEntries.push(failoverAudit);
        }
      );

      recordAudit(AUDIT_ACTIONS.PLAN_GENERATED, {
        stepCount: planResult.steps.length,
        estimatedRisk: planResult.estimatedRisk,
        provider: planResult.providerUsed,
        model: planResult.modelUsed,
      });

      if (typeof callbacks?.onPlanReady === 'function') {
        try {
          await callbacks.onPlanReady(planResult);
        } catch (cbErr) {}
      }

      const executedSteps = [];

      // ─── 2. STEP EXECUTION LOOP ────────────────────────────────────
      for (const rawStep of planResult.steps) {
        const stepIndex = rawStep.stepIndex;
        const step = {
          stepIndex,
          description: rawStep.reason || `Execute ${rawStep.tool}`,
          tool: rawStep.tool,
          params: rawStep.parameters || {},
          riskLevel: 'LOW',
          status: STEP_STATUSES.PENDING,
          result: null,
          error: null,
          startedAt: null,
          completedAt: null,
        };

        // 2a. Deterministic Policy Check
        const policyDecision = this.policyEngine.evaluateStep(rawStep);
        step.riskLevel = policyDecision.riskLevel;

        if (!policyDecision.allowed) {
          step.status = STEP_STATUSES.FAILED;
          step.error = policyDecision.reason;
          recordAudit(AUDIT_ACTIONS.STEP_FAILED, { reason: policyDecision.reason }, stepIndex);
          executedSteps.push(step);

          return {
            status: TASK_STATES.FAILED,
            plan: { steps: executedSteps },
            result: null,
            auditEntries,
            error: { code: 'POLICY_VIOLATION', message: policyDecision.reason },
          };
        }

        // 2b. Human-in-the-Loop Approval Check (HIGH Risk)
        if (policyDecision.requiresApproval) {
          step.status = STEP_STATUSES.AWAITING_APPROVAL;
          recordAudit(
            AUDIT_ACTIONS.APPROVAL_REQUESTED,
            { tool: step.tool, riskLevel: step.riskLevel, params: step.params },
            stepIndex
          );

          let approvalResult = null;
          if (typeof requestApprovalCallback === 'function') {
            approvalResult = await requestApprovalCallback({
              taskId,
              stepIndex,
              tool: step.tool,
              params: step.params,
              riskLevel: step.riskLevel,
              reason: policyDecision.reason,
            });
          }

          if (!approvalResult || approvalResult.decision !== 'APPROVED') {
            step.status = STEP_STATUSES.REJECTED;
            step.error = approvalResult?.reason || 'Human approval was denied or rejected';
            recordAudit(AUDIT_ACTIONS.APPROVAL_DENIED, { reason: step.error }, stepIndex);
            executedSteps.push(step);

            return {
              status: TASK_STATES.FAILED,
              plan: { steps: executedSteps },
              result: null,
              auditEntries,
              error: { code: 'APPROVAL_DENIED', message: step.error },
            };
          }

          recordAudit(AUDIT_ACTIONS.APPROVAL_GRANTED, { reason: approvalResult.reason }, stepIndex);
          step.status = STEP_STATUSES.APPROVED;
        }

        // 2c. Tool Execution
        step.status = STEP_STATUSES.EXECUTING;
        step.startedAt = new Date().toISOString();
        recordAudit(AUDIT_ACTIONS.STEP_STARTED, { tool: step.tool }, stepIndex);

        if (typeof callbacks?.onStepStart === 'function') {
          try {
            await callbacks.onStepStart(step);
          } catch (cbErr) {}
        }

        const toolResult = await this.toolRouter.executeTool(step.tool, step.params);
        recordAudit(
          toolResult.success ? AUDIT_ACTIONS.TOOL_EXECUTED : AUDIT_ACTIONS.TOOL_FAILED,
          { durationMs: toolResult.durationMs, success: toolResult.success },
          stepIndex
        );

        // 2d. Observation
        const observation = this.observer.observe(step, toolResult);

        if (!observation.success) {
          step.status = STEP_STATUSES.FAILED;
          step.error = observation.error;
          step.completedAt = new Date().toISOString();
          recordAudit(AUDIT_ACTIONS.STEP_FAILED, { error: step.error }, stepIndex);
          executedSteps.push(step);

          if (typeof callbacks?.onStepComplete === 'function') {
            try {
              await callbacks.onStepComplete(step);
            } catch (cbErr) {}
          }

          // Trigger Replanner
          const recovery = this.replanner.evaluateRecovery(step, observation.error, 0);
          if (recovery.shouldAbort) {
            return {
              status: TASK_STATES.FAILED,
              plan: { steps: executedSteps },
              result: null,
              auditEntries,
              error: { code: 'EXECUTION_FAILED', message: recovery.reason },
            };
          }
        } else {
          step.status = STEP_STATUSES.COMPLETED;
          step.result = observation.evidence;
          step.completedAt = new Date().toISOString();
          recordAudit(AUDIT_ACTIONS.STEP_COMPLETED, { observation: observation.observation }, stepIndex);
          executedSteps.push(step);

          if (typeof callbacks?.onStepComplete === 'function') {
            try {
              await callbacks.onStepComplete(step);
            } catch (cbErr) {}
          }
        }
      }

      // ─── 3. VERIFICATION-BEFORE-SUCCESS ────────────────────────────
      recordAudit(AUDIT_ACTIONS.VERIFICATION_STARTED, { executedStepsCount: executedSteps.length });
      const verification = this.verifier.verify(goal, executedSteps);

      if (!verification.verified) {
        recordAudit(AUDIT_ACTIONS.VERIFICATION_FAILED, { reason: verification.summary });
        return {
          status: TASK_STATES.FAILED,
          plan: { steps: executedSteps },
          result: { summary: verification.summary, evidence: verification.evidence, verified: false },
          auditEntries,
          error: { code: 'VERIFICATION_FAILED', message: verification.summary },
        };
      }

      recordAudit(AUDIT_ACTIONS.VERIFICATION_PASSED, { summary: verification.summary });
      recordAudit(AUDIT_ACTIONS.TASK_COMPLETED, { summary: verification.summary });

      return {
        status: TASK_STATES.COMPLETED,
        plan: { steps: executedSteps },
        result: {
          summary: verification.summary,
          evidence: verification.evidence,
          verified: true,
        },
        auditEntries,
        error: null,
      };
    } catch (err) {
      recordAudit(AUDIT_ACTIONS.TASK_FAILED, { error: err.message });
      return {
        status: TASK_STATES.FAILED,
        plan: { steps: [] },
        result: null,
        auditEntries,
        error: { code: 'ORCHESTRATOR_ERROR', message: err.message },
      };
    }
  }
}

const defaultOrchestrator = new Orchestrator();

module.exports = {
  Orchestrator,
  executeTask: (input, callback) => defaultOrchestrator.executeTask(input, callback),
  getAvailableTools: () => defaultOrchestrator.getAvailableTools(),
};
