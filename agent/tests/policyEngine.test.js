const { policyEngine } = require('../src/policy/policyEngine');
const { RISK_LEVELS } = require('../../shared/riskLevels');

describe('PolicyEngine Deterministic Boundaries', () => {
  test('permits safe LOW-risk tools with valid parameters', () => {
    const decision = policyEngine.evaluateStep({
      tool: 'weather_api',
      parameters: { city: 'Chennai' },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);
    expect(decision.riskLevel).toBe(RISK_LEVELS.LOW);
  });

  test('flags HIGH-risk operations as requiring human approval', () => {
    const decision = policyEngine.evaluateStep({
      tool: 'github_create_issue',
      parameters: { owner: 'org', repo: 'repo', title: 'Bug in auth' },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
    expect(decision.riskLevel).toBe(RISK_LEVELS.HIGH);
  });

  test('immediately blocks DISALLOWED operations', () => {
    const shellDecision = policyEngine.evaluateStep({
      tool: 'run_shell_command',
      parameters: { command: 'rm -rf /' },
    });

    expect(shellDecision.allowed).toBe(false);
    expect(shellDecision.riskLevel).toBe(RISK_LEVELS.DISALLOWED);
    expect(shellDecision.error).toBe('PROHIBITED_ACTION');

    const sqlDecision = policyEngine.evaluateStep({
      tool: 'database_query',
      parameters: { sql: 'DROP TABLE tasks;' },
    });

    expect(sqlDecision.allowed).toBe(false);
    expect(sqlDecision.riskLevel).toBe(RISK_LEVELS.DISALLOWED);
  });

  test('rejects unregistered tool names', () => {
    const decision = policyEngine.evaluateStep({
      tool: 'unknown_hallucinated_tool',
      parameters: {},
    });

    expect(decision.allowed).toBe(false);
    expect(decision.riskLevel).toBe(RISK_LEVELS.DISALLOWED);
    expect(decision.error).toBe('UNREGISTERED_TOOL');
  });

  test('rejects missing required parameters', () => {
    const decision = policyEngine.evaluateStep({
      tool: 'weather_api',
      parameters: {}, // missing 'city'
    });

    expect(decision.allowed).toBe(false);
    expect(decision.error).toBe('PARAMETER_VALIDATION_ERROR');
  });
});
