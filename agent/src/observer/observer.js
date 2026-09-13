/**
 * AURA Agent — Observer Module
 *
 * Source: docs/02-ARCHITECTURE.md §3, docs/11-INTEGRATION-CONTRACT.md §7
 *
 * Analyzes tool execution outputs, extracts verifiable evidence,
 * and synthesizes observations for subsequent steps and verification.
 */

class Observer {
  /**
   * Observe and synthesize evidence from a tool execution.
   *
   * @param {Object} step - Step definition
   * @param {Object} toolResult - Output from toolRouter
   * @returns {{
   *   success: boolean,
   *   observation: string,
   *   evidence: Object,
   *   error: string|null
   * }}
   */
  observe(step, toolResult) {
    if (!toolResult.success) {
      return {
        success: false,
        observation: `Step ${step.stepIndex} (${step.tool}) failed: ${toolResult.error?.message || 'Unknown error'}`,
        evidence: { tool: step.tool, rawStatus: toolResult.rawStatus },
        error: toolResult.error?.message || 'Tool execution failure',
      };
    }

    const data = toolResult.data || {};
    let summaryText = `Tool ${step.tool} executed successfully.`;

    if (step.tool === 'weather_api') {
      summaryText = `Weather observed for ${data.city}: ${data.temperature}°C, ${data.condition} (humidity: ${data.humidity}%).`;
    } else if (step.tool === 'github_issues') {
      summaryText = `Observed ${data.totalIssues || 0} issues in ${data.repository}.`;
    } else if (step.tool === 'github_create_issue') {
      summaryText = `Created issue #${data.id} ("${data.title}") in ${data.repository}.`;
    } else if (step.tool === 'calculator') {
      summaryText = `Computed ${data.expression} = ${data.result}.`;
    } else if (step.tool === 'web_search') {
      summaryText = `Search yielded ${data.resultsCount || 0} results for query "${data.query}".`;
    }

    return {
      success: true,
      observation: summaryText,
      evidence: data,
      error: null,
    };
  }
}

const defaultObserver = new Observer();

module.exports = {
  Observer,
  defaultObserver,
};
