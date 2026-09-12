/**
 * AURA — Canonical Task States
 *
 * Source of truth: docs/03-API-CONTRACT.md §5
 * Integration contract: docs/11-INTEGRATION-CONTRACT.md §4
 *
 * ALL modules (frontend, backend, agent) import from this file.
 * No module defines its own task state constants.
 */

const TASK_STATES = Object.freeze({
  QUEUED: 'QUEUED',
  PLANNING: 'PLANNING',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  EXECUTING: 'EXECUTING',
  OBSERVING: 'OBSERVING',
  REPLANNING: 'REPLANNING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  PARTIALLY_COMPLETED: 'PARTIALLY_COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

/** Terminal states — task cannot transition out of these */
const TERMINAL_STATES = Object.freeze([
  TASK_STATES.COMPLETED,
  TASK_STATES.PARTIALLY_COMPLETED,
  TASK_STATES.FAILED,
  TASK_STATES.CANCELLED,
]);

/**
 * Check if a task state is terminal (no further transitions allowed).
 * @param {string} state
 * @returns {boolean}
 */
function isTerminalState(state) {
  return TERMINAL_STATES.includes(state);
}

/** All valid task state values (for CHECK constraints, validation) */
const ALL_TASK_STATES = Object.freeze(Object.values(TASK_STATES));

module.exports = {
  TASK_STATES,
  TERMINAL_STATES,
  isTerminalState,
  ALL_TASK_STATES,
};
