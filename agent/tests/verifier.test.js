const { defaultVerifier } = require('../src/verifier/verifier');

describe('Verifier — Verification-Before-Success Principle', () => {
  test('passes verification when valid evidence exists for completed steps', () => {
    const steps = [
      {
        stepIndex: 0,
        tool: 'weather_api',
        status: 'COMPLETED',
        result: { city: 'Chennai', temperature: 31, condition: 'Partly Cloudy' },
      },
    ];

    const outcome = defaultVerifier.verify('Check weather in Chennai', steps);
    expect(outcome.verified).toBe(true);
    expect(outcome.confidence).toBeGreaterThan(0.9);
    expect(outcome.evidence).toHaveProperty('step_0_weather_api');
    expect(outcome.summary).toContain('Weather for Chennai');
  });

  test('fails verification if any executed step failed', () => {
    const steps = [
      {
        stepIndex: 0,
        tool: 'weather_api',
        status: 'FAILED',
        error: 'Network timeout',
      },
    ];

    const outcome = defaultVerifier.verify('Check weather in Chennai', steps);
    expect(outcome.verified).toBe(false);
    expect(outcome.confidence).toBe(0);
    expect(outcome.summary).toContain('failed');
  });

  test('fails verification if step list is empty', () => {
    const outcome = defaultVerifier.verify('Check weather', []);
    expect(outcome.verified).toBe(false);
  });
});
