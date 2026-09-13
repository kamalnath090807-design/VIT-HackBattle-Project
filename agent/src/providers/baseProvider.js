/**
 * AURA Agent — Base LLM Provider Interface
 *
 * Source: docs/11-INTEGRATION-CONTRACT.md §8.1
 * All provider adapters (Groq, Gemini) must implement this interface.
 * The core agent communicates ONLY through this contract.
 */

class BaseLLMProvider {
  /**
   * @param {string} name - Provider identifier ('groq' | 'gemini')
   * @param {string} model - Configured model identifier
   */
  constructor(name, model) {
    if (new.target === BaseLLMProvider) {
      throw new TypeError('Cannot construct BaseLLMProvider instances directly');
    }
    this.name = name;
    this.model = model;
  }

  /**
   * Generate a structured execution plan from a goal.
   * @param {Object} planRequest
   * @param {string} planRequest.goal - User goal text
   * @param {Array<Object>} planRequest.tools - Available tool definitions
   * @param {number} [planRequest.maxSteps=10] - Execution step limit
   * @returns {Promise<Object>} NormalizedPlanResult per docs/11-INTEGRATION-CONTRACT §8.2
   */
  async generatePlan(planRequest) {
    throw new Error('generatePlan() must be implemented by subclass');
  }

  /**
   * General-purpose chat completion with structured JSON output.
   * @param {Object} chatRequest
   * @param {Array<{role: string, content: string}>} chatRequest.messages
   * @param {Object} [chatRequest.responseFormat]
   * @param {number} [chatRequest.temperature]
   * @returns {Promise<Object>} NormalizedChatResponse
   */
  async chatCompletion(chatRequest) {
    throw new Error('chatCompletion() must be implemented by subclass');
  }
}

module.exports = { BaseLLMProvider };
