/**
 * Tests for PCEngine
 */

const { PCEngine, PROTECTED_PROCESSES } = require('../src/automation/pcEngine');

describe('PCEngine', () => {
  let pc;

  beforeEach(() => {
    pc = new PCEngine();
  });

  it('1. Resolves common applications to executable commands', () => {
    expect(pc.resolveApp('vscode')).toBe('code');
    expect(pc.resolveApp('vs code')).toBe('code');
    expect(pc.resolveApp('google chrome')).toBe('chrome');
    expect(pc.resolveApp('notepad')).toBe('notepad');
  });

  it('2. Enforces strict safety blacklist against terminating critical system processes', async () => {
    await expect(pc.closeProcess('svchost.exe')).rejects.toThrow('SAFETY VIOLATION');
    await expect(pc.closeProcess('explorer')).rejects.toThrow('SAFETY VIOLATION');
    await expect(pc.closeProcess('dwm.exe')).rejects.toThrow('SAFETY VIOLATION');
  });

  it('3. Returns live Windows system telemetry metrics', async () => {
    const result = await pc.getSystemMetrics();
    expect(result.success).toBe(true);
    expect(result.metrics.ramPercent).toBeGreaterThan(0);
    expect(result.summary).toContain('RAM:');
  });

  it('4. Enforces MCQ 2-dot clicking invariant: NO_VALIDATED_TARGET = NO_CLICK', async () => {
    const emptyResult = await pc.solveMCQ('123');
    expect(emptyResult.code).toBe('NO_VALIDATED_TARGET');

    const validResult = await pc.solveMCQ('What is the capital of France? Option B: Paris');
    expect(validResult.success).toBe(true);
    expect(validResult.sequence.length).toBe(2);
    expect(validResult.sequence[0].status).toBe('VERIFIED');
    expect(validResult.sequence[1].status).toBe('COMPLETED');
  });
});
