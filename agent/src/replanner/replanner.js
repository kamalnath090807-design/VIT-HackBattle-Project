/**
 * AURA Agent — Replanner Module
 *
 * Source: docs/02-ARCHITECTURE.md §3, docs/11-INTEGRATION-CONTRACT.md §7
 *
 * Dynamically adjusts plan upon step failure or unexpected observations.
 * Prevents infinite loops by enforcing retry limits (max 2 retries).
 */

class Replanner {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 2;
  }

  /**
   * Evaluate whether a failed step can be recovered.
   *
   * @param {Object} failedStep
   * @param {string} failureReason
   * @param {number} retryCount
   * @returns {{
   *   shouldAbort: boolean,
   *   reason: string,
   *   recoveryStep?: Object
   * }}
   */
  evaluateRecovery(failedStep, failureReason, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      return {
        shouldAbort: true,
        reason: `Exceeded maximum retries (${this.maxRetries}) for step ${failedStep.stepIndex}`,
      };
    }

    // Attempt alternative fallback or retry
    if (failedStep.tool === 'weather_api') {
      return {
        shouldAbort: false,
        reason: 'Retrying weather lookup with standardized city format',
        recoveryStep: {
          ...failedStep,
          parameters: { city: (failedStep.parameters?.city || '').trim() },
          reason: `Retry attempt ${retryCount + 1}: ${failureReason}`,
        },
      };
    }

    return {
      shouldAbort: true,
      reason: `Unrecoverable failure on step ${failedStep.stepIndex}: ${failureReason}`,
    };
  }
}

const defaultReplanner = new Replanner();

module.exports = {
  Replanner,
  defaultReplanner,
};
