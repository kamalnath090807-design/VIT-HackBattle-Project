/**
 * AURA Backend — TaskService Unit Tests
 *
 * Tests task lifecycle logic without hitting real DB or agent.
 */

const { TASK_STATES, isTerminalState } = require('../../../shared/taskStates');

describe('TaskService Logic', () => {
  describe('isTerminalState', () => {
    test('COMPLETED is terminal', () => {
      expect(isTerminalState(TASK_STATES.COMPLETED)).toBe(true);
    });

    test('PARTIALLY_COMPLETED is terminal', () => {
      expect(isTerminalState(TASK_STATES.PARTIALLY_COMPLETED)).toBe(true);
    });

    test('FAILED is terminal', () => {
      expect(isTerminalState(TASK_STATES.FAILED)).toBe(true);
    });

    test('CANCELLED is terminal', () => {
      expect(isTerminalState(TASK_STATES.CANCELLED)).toBe(true);
    });

    test('QUEUED is not terminal', () => {
      expect(isTerminalState(TASK_STATES.QUEUED)).toBe(false);
    });

    test('PLANNING is not terminal', () => {
      expect(isTerminalState(TASK_STATES.PLANNING)).toBe(false);
    });

    test('EXECUTING is not terminal', () => {
      expect(isTerminalState(TASK_STATES.EXECUTING)).toBe(false);
    });

    test('AWAITING_APPROVAL is not terminal', () => {
      expect(isTerminalState(TASK_STATES.AWAITING_APPROVAL)).toBe(false);
    });

    test('VERIFYING is not terminal', () => {
      expect(isTerminalState(TASK_STATES.VERIFYING)).toBe(false);
    });
  });

  describe('Task State Constants', () => {
    test('all expected states exist', () => {
      const expected = [
        'QUEUED', 'PLANNING', 'AWAITING_APPROVAL', 'EXECUTING',
        'OBSERVING', 'REPLANNING', 'VERIFYING', 'COMPLETED',
        'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED',
      ];
      expected.forEach((state) => {
        expect(TASK_STATES[state]).toBe(state);
      });
    });

    test('TASK_STATES is frozen', () => {
      expect(Object.isFrozen(TASK_STATES)).toBe(true);
    });
  });
});
