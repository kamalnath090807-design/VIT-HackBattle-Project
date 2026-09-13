/**
 * AURA Agent — Deterministic Policy Engine
 *
 * Source: docs/08-SECURITY.md §4, docs/10-DECISIONS.md ADR-010
 *
 * MANDATORY RULE: The LLM must NEVER independently determine security decisions.
 * Risk classification and tool execution authorization are strictly deterministic.
 */

const { RISK_LEVELS } = require('../../../shared/riskLevels');
const { getTool, validateParameters } = require('../tools/toolRegistry');

class PolicyEngine {
  /**
   * Evaluate a proposed plan step against security policies.
   *
   * @param {Object} step
   * @param {string} step.tool - Proposed tool name
   * @param {Object} [step.parameters] - Tool parameters
   * @param {number} [step.stepIndex=0]
   * @returns {{
   *   allowed: boolean,
   *   requiresApproval: boolean,
   *   riskLevel: string,
   *   reason: string,
   *   error?: string
   * }}
   */
  evaluateStep(step) {
    if (!step || !step.tool) {
      return {
        allowed: false,
        requiresApproval: false,
        riskLevel: RISK_LEVELS.DISALLOWED,
        reason: 'Step missing tool identifier',
        error: 'INVALID_STEP_DEFINITION',
      };
    }

    const toolDef = getTool(step.tool);

    // 1. Tool must be registered in the catalog
    if (!toolDef) {
      return {
        allowed: false,
        requiresApproval: false,
        riskLevel: RISK_LEVELS.DISALLOWED,
        reason: `Tool '${step.tool}' is not registered in the system tool catalog`,
        error: 'UNREGISTERED_TOOL',
      };
    }

    // 2. DISALLOWED tools can never be executed under any circumstances
    if (toolDef.riskLevel === RISK_LEVELS.DISALLOWED) {
      return {
        allowed: false,
        requiresApproval: false,
        riskLevel: RISK_LEVELS.DISALLOWED,
        reason: `Tool '${step.tool}' is prohibited by safety policy`,
        error: 'PROHIBITED_ACTION',
      };
    }

    // 3. Validate input parameters against schema
    const params = step.parameters || step.params || {};
    const validation = validateParameters(toolDef, params);
    if (!validation.valid) {
      return {
        allowed: false,
        requiresApproval: false,
        riskLevel: toolDef.riskLevel,
        reason: `Parameter validation failed: ${validation.error}`,
        error: 'PARAMETER_VALIDATION_ERROR',
      };
    }

    // 3b. Additional deterministic safety checks for external messaging destinations
    if (step.tool === 'send_message') {
      if (params.channel === 'whatsapp' || params.channel === 'sms') {
        const cleaned = (params.destination || '').replace(/[\s\(\)\-\.]/g, '');
        if (!cleaned.startsWith('+') || cleaned.length < 8) {
          return {
            allowed: false,
            requiresApproval: false,
            riskLevel: RISK_LEVELS.DISALLOWED,
            reason: `Destination phone "${params.destination}" is not in valid international E.164 format (+CountryCodeNumber). Bare numbers are prohibited for safety.`,
            error: 'INVALID_DESTINATION_FORMAT',
          };
        }
      } else if (params.channel === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test((params.destination || '').trim())) {
          return {
            allowed: false,
            requiresApproval: false,
            riskLevel: RISK_LEVELS.DISALLOWED,
            reason: `Destination email "${params.destination}" has invalid syntax.`,
            error: 'INVALID_EMAIL_FORMAT',
          };
        }
      }
    }

    // 4. HIGH risk operations require approval (auto-authorized in approvalService in autonomous mode)
    if (toolDef.riskLevel === RISK_LEVELS.HIGH || toolDef.requiresApproval) {
      return {
        allowed: true,
        requiresApproval: true,
        riskLevel: RISK_LEVELS.HIGH,
        reason: 'Operation modifies external state and requires user approval',
      };
    }

    // 5. MEDIUM risk operations: allowed with enhanced logging
    if (toolDef.riskLevel === RISK_LEVELS.MEDIUM) {
      return {
        allowed: true,
        requiresApproval: false,
        riskLevel: RISK_LEVELS.MEDIUM,
        reason: 'Operation allowed with enhanced audit logging',
      };
    }

    // 6. LOW risk operations: auto-approved
    return {
      allowed: true,
      requiresApproval: false,
      riskLevel: RISK_LEVELS.LOW,
      reason: 'Read-only safe operation',
    };
  }
}

// Export singleton instance
const policyEngine = new PolicyEngine();

module.exports = {
  PolicyEngine,
  policyEngine,
};
