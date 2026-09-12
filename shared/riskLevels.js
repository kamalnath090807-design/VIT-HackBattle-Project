/**
 * AURA — Canonical Risk Levels
 *
 * Source of truth: docs/08-SECURITY.md §4
 * Integration contract: docs/11-INTEGRATION-CONTRACT.md §5
 *
 * ALL modules import from this file.
 * No module defines its own risk level constants.
 */

const RISK_LEVELS = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  DISALLOWED: 'DISALLOWED',
});

/** All valid risk level values */
const ALL_RISK_LEVELS = Object.freeze(Object.values(RISK_LEVELS));

module.exports = {
  RISK_LEVELS,
  ALL_RISK_LEVELS,
};
