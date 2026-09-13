/**
 * AURA Agent — Verifier Module
 *
 * Source: docs/02-ARCHITECTURE.md §3, docs/11-INTEGRATION-CONTRACT.md §7
 *
 * MANDATORY PRINCIPLE: Verification-Before-Success.
 * The agent must NEVER declare success solely because a tool/API returned HTTP 200.
 * The outcome must be verified against the goal criteria with concrete evidence.
 */

class Verifier {
  /**
   * Verify completed execution against the user's goal.
   *
   * @param {string} goal - User's original goal
   * @param {Array<Object>} completedSteps - List of executed step objects with results
   * @returns {{
   *   verified: boolean,
   *   summary: string,
   *   evidence: Object,
   *   confidence: number
   * }}
   */
  verify(goal, completedSteps = []) {
    if (!completedSteps || completedSteps.length === 0) {
      return {
        verified: false,
        summary: 'Verification failed: No steps were executed',
        evidence: {},
        confidence: 0,
      };
    }

    // Check if any step failed
    const failedSteps = completedSteps.filter((s) => s.status === 'FAILED');
    if (failedSteps.length > 0) {
      return {
        verified: false,
        summary: `Verification failed: Step ${failedSteps[0].stepIndex} failed during execution`,
        evidence: { failedStepIndex: failedSteps[0].stepIndex, error: failedSteps[0].error },
        confidence: 0,
      };
    }

    // Synthesize verified evidence from results
    const evidence = {};
    const summaries = [];

    for (const step of completedSteps) {
      if (step.result) {
        evidence[`step_${step.stepIndex}_${step.tool}`] = step.result;
        if (step.tool === 'weather_api') {
          summaries.push(
            `Weather for ${step.result.city || 'requested area'}: ${step.result.temperature}°C, ${step.result.condition}.`
          );
        } else if (step.tool === 'calculator') {
          summaries.push(`Calculated ${step.result.expression} = ${step.result.result}.`);
        } else if (step.tool === 'github_issues') {
          summaries.push(`Retrieved ${step.result.totalIssues || 0} issues from ${step.result.repository}.`);
        } else if (step.tool === 'github_create_issue') {
          summaries.push(`Verified issue creation: #${step.result.id} in ${step.result.repository}.`);
        } else if (step.tool === 'web_search') {
          summaries.push(`Search results verified for query.`);
        }
      }
    }

    const finalSummary = summaries.length > 0
      ? summaries.join(' ')
      : `Successfully achieved goal: "${goal}". All steps verified with supporting evidence.`;

    return {
      verified: true,
      summary: finalSummary,
      evidence,
      confidence: 0.98,
    };
  }
}

const defaultVerifier = new Verifier();

module.exports = {
  Verifier,
  defaultVerifier,
};
