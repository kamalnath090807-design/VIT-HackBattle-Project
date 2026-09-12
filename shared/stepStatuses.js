/**
 * AURA — Canonical Step Statuses
 *
 * Source of truth: docs/05-DATABASE.md §3.3
 * Integration contract: docs/11-INTEGRATION-CONTRACT.md §5
 *
 * ALL modules import from this file.
 * No module defines its own step status constants.
 */

const STEP_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

/** All valid step status values */
const ALL_STEP_STATUSES = Object.freeze(Object.values(STEP_STATUSES));

module.exports = {
  STEP_STATUSES,
  ALL_STEP_STATUSES,
};
