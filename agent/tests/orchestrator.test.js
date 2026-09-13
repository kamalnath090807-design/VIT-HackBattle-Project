const { Orchestrator } = require('../src/orchestrator');
const { TASK_STATES } = require('../../shared/taskStates');
const { STEP_STATUSES } = require('../../shared/stepStatuses');
const { AUDIT_ACTIONS } = require('../../shared/auditActions');

describe('Orchestrator End-to-End Autonomous Lifecycle', () => {
  test('executes safe task to COMPLETED with verification and audit trail', async () => {
    const orchestrator = new Orchestrator();

    const input = {
      taskId: 'test-task-123',
      goal: 'What is 42 * 2?',
      userId: 'user-001',
    };

    const result = await orchestrator.executeTask(input);

    expect(result.status).toBe(TASK_STATES.COMPLETED);
    expect(result.result.verified).toBe(true);
    expect(result.plan.steps.length).toBeGreaterThan(0);
    expect(result.plan.steps[0].status).toBe(STEP_STATUSES.COMPLETED);

    // Verify comprehensive audit trail
    const actions = result.auditEntries.map((a) => a.action);
    expect(actions).toContain(AUDIT_ACTIONS.TASK_CREATED);
    expect(actions).toContain(AUDIT_ACTIONS.PLAN_GENERATED);
    expect(actions).toContain(AUDIT_ACTIONS.STEP_STARTED);
    expect(actions).toContain(AUDIT_ACTIONS.TOOL_EXECUTED);
    expect(actions).toContain(AUDIT_ACTIONS.STEP_COMPLETED);
    expect(actions).toContain(AUDIT_ACTIONS.VERIFICATION_PASSED);
    expect(actions).toContain(AUDIT_ACTIONS.TASK_COMPLETED);
  });

  test('pauses and requests approval for HIGH-risk operation', async () => {
    const orchestrator = new Orchestrator();

    // Mock planner to produce HIGH-risk step (github_create_issue)
    orchestrator.planner.plan = jest.fn().mockResolvedValue({
      steps: [
        {
          stepIndex: 0,
          tool: 'github_create_issue',
          parameters: { owner: 'aura-team', repo: 'project', title: 'Critical Bug' },
          reason: 'Create tracking issue',
        },
      ],
      estimatedRisk: 'HIGH',
      providerUsed: 'groq',
      modelUsed: 'mock-model',
    });

    const approvalCallback = jest.fn().mockResolvedValue({
      decision: 'APPROVED',
      reason: 'User approved from frontend modal',
    });

    const result = await orchestrator.executeTask(
      { taskId: 'high-risk-task', goal: 'File critical bug', userId: 'user-001' },
      approvalCallback
    );

    expect(approvalCallback).toHaveBeenCalledTimes(1);
    expect(approvalCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: 'github_create_issue',
        riskLevel: 'HIGH',
      })
    );
    expect(result.status).toBe(TASK_STATES.COMPLETED);
  });

  test('aborts and records rejection when human approval is denied', async () => {
    const orchestrator = new Orchestrator();

    orchestrator.planner.plan = jest.fn().mockResolvedValue({
      steps: [
        {
          stepIndex: 0,
          tool: 'github_create_issue',
          parameters: { owner: 'aura-team', repo: 'project', title: 'Suspicious Issue' },
          reason: 'Create issue',
        },
      ],
      estimatedRisk: 'HIGH',
      providerUsed: 'groq',
      modelUsed: 'mock-model',
    });

    const approvalCallback = jest.fn().mockResolvedValue({
      decision: 'REJECTED',
      reason: 'Rejected by security auditor',
    });

    const result = await orchestrator.executeTask(
      { taskId: 'rejected-task', goal: 'File issue', userId: 'user-001' },
      approvalCallback
    );

    expect(result.status).toBe(TASK_STATES.FAILED);
    expect(result.error.code).toBe('APPROVAL_DENIED');
    const actions = result.auditEntries.map((a) => a.action);
    expect(actions).toContain(AUDIT_ACTIONS.APPROVAL_DENIED);
  });
});
