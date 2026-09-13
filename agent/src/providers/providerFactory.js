/**
 * AURA Agent — Provider Factory & Failover Manager
 *
 * Source: docs/02-ARCHITECTURE.md §4, docs/11-INTEGRATION-CONTRACT.md §8.3
 *
 * Resolves the active provider (default: Groq).
 * Handles automatic failover to Google Gemini upon 429, 5xx, or timeout.
 * Emits LLM_PROVIDER_FAILOVER audit entry when failover occurs.
 */

const { GroqProvider } = require('./groqProvider');
const { GeminiProvider } = require('./geminiProvider');
const { AUDIT_ACTIONS } = require('../../../shared/auditActions');

class ProviderFactory {
  constructor(options = {}) {
    this.primaryName = options.aiProvider || process.env.AI_PROVIDER || 'groq';
    this.enableFallback =
      options.enableFallback !== undefined
        ? options.enableFallback
        : process.env.AI_ENABLE_FALLBACK !== 'false';

    this.groq = new GroqProvider(options.groq || {});
    this.gemini = new GeminiProvider(options.gemini || {});
  }

  /**
   * Get the designated primary provider.
   * @returns {import('./baseProvider').BaseLLMProvider}
   */
  getPrimaryProvider() {
    return this.primaryName === 'gemini' ? this.gemini : this.groq;
  }

  /**
   * Get the designated fallback provider.
   * @returns {import('./baseProvider').BaseLLMProvider}
   */
  getFallbackProvider() {
    return this.primaryName === 'gemini' ? this.groq : this.gemini;
  }

  /**
   * Generate an execution plan with automated failover handling.
   *
   * @param {Object} planRequest
   * @param {Function} [onAuditRecord] - Callback to receive audit records (e.g. failover)
   * @returns {Promise<Object>} NormalizedPlanResult
   */
  async generatePlanWithFailover(planRequest, onAuditRecord) {
    const primary = this.getPrimaryProvider();
    const fallback = this.getFallbackProvider();

    try {
      return await primary.generatePlan(planRequest);
    } catch (primaryError) {
      // Determine if failover should occur
      const shouldFailover =
        this.enableFallback &&
        (primaryError.code === 'RATE_LIMIT_EXCEEDED' ||
          primaryError.code === 'PROVIDER_UNAVAILABLE' ||
          primaryError.code === 'TIMEOUT' ||
          primaryError.statusCode === 429 ||
          (primaryError.statusCode >= 500 && primaryError.statusCode <= 504) ||
          primaryError.name === 'AbortError');

      if (!shouldFailover) {
        throw primaryError;
      }

      // Record failover audit entry per docs/11-INTEGRATION-CONTRACT §8.3
      const failoverAudit = {
        taskId: planRequest.taskId || 'system',
        action: AUDIT_ACTIONS.LLM_PROVIDER_FAILOVER,
        details: {
          primaryProvider: primary.name,
          fallbackProvider: fallback.name,
          reason: primaryError.message,
          attemptedModel: primary.model,
          fallbackModel: fallback.model,
        },
        timestamp: new Date().toISOString(),
      };

      if (typeof onAuditRecord === 'function') {
        onAuditRecord(failoverAudit);
      }

      // Execute with fallback provider
      try {
        const fallbackResult = await fallback.generatePlan(planRequest);
        fallbackResult.failoverAudit = failoverAudit;
        return fallbackResult;
      } catch (fallbackError) {
        // If both providers fail (e.g. API quota or credits issue), gracefully generate offline plan
        const offlineResult =
          typeof fallback._generateOfflinePlan === 'function'
            ? fallback._generateOfflinePlan(planRequest, Date.now())
            : typeof primary._generateOfflinePlan === 'function'
            ? primary._generateOfflinePlan(planRequest, Date.now())
            : null;

        if (offlineResult) {
          offlineResult.failoverAudit = failoverAudit;
          offlineResult.fallbackError = fallbackError.message;
          return offlineResult;
        }

        throw fallbackError;
      }
    }
  }
}

// Default singleton instance
const defaultFactory = new ProviderFactory();

module.exports = {
  ProviderFactory,
  defaultFactory,
};
