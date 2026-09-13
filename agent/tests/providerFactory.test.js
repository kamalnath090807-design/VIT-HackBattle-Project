const { ProviderFactory } = require('../src/providers/providerFactory');
const { AUDIT_ACTIONS } = require('../../shared/auditActions');

describe('ProviderFactory & Failover Mechanism', () => {
  test('returns primary provider (groq) by default', () => {
    const factory = new ProviderFactory({ aiProvider: 'groq' });
    const primary = factory.getPrimaryProvider();
    expect(primary.name).toBe('groq');
  });

  test('successfully triggers fallback to gemini on 429 rate limit', async () => {
    const factory = new ProviderFactory({
      aiProvider: 'groq',
      enableFallback: true,
    });

    // Mock primary to throw 429 RATE_LIMIT_EXCEEDED
    factory.groq.generatePlan = jest.fn().mockRejectedValue({
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      message: 'Groq Cloud API rate limit reached',
    });

    // Mock fallback to succeed
    factory.gemini.generatePlan = jest.fn().mockResolvedValue({
      success: true,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      plan: { steps: [{ stepIndex: 0, tool: 'web_search', parameters: { query: 'test' } }] },
    });

    const auditRecords = [];
    const result = await factory.generatePlanWithFailover(
      { goal: 'Find documentation', maxSteps: 5 },
      (record) => auditRecords.push(record)
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(auditRecords.length).toBe(1);
    expect(auditRecords[0].action).toBe(AUDIT_ACTIONS.LLM_PROVIDER_FAILOVER);
    expect(auditRecords[0].details.primaryProvider).toBe('groq');
    expect(auditRecords[0].details.fallbackProvider).toBe('gemini');
  });
});
