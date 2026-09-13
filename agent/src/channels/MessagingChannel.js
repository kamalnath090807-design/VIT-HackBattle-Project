/**
 * AURA Agent — Base Messaging Channel Abstraction
 *
 * Source: docs/02-ARCHITECTURE.md & Implementation Plan
 *
 * Enforces unified contract for all communication channels.
 * Channels must NEVER claim DELIVERED if provider only confirms ACCEPTED.
 */

class MessagingChannel {
  /**
   * @param {string} channelName - 'whatsapp' | 'email' | 'sms'
   */
  constructor(channelName) {
    if (!channelName) throw new Error('Channel name is required');
    this.channelName = channelName.toLowerCase();
  }

  getChannelName() {
    return this.channelName;
  }

  /**
   * Validate that the destination is structurally valid for this channel.
   * Must be overridden by subclasses.
   * @param {string} destination
   * @returns {{ valid: boolean, error?: string }}
   */
  validateDestination(destination) {
    throw new Error('validateDestination must be implemented by subclass');
  }

  /**
   * Send a message through this authorized channel.
   *
   * @param {Object} payload
   * @param {string} payload.destination - E.164 phone or email
   * @param {string} payload.message - Message body
   * @param {string} [payload.subject] - Optional subject (email)
   * @param {string} [payload.recipientName] - Display name
   * @param {Object} [payload.metadata] - Extra context
   * @returns {Promise<{
   *   success: boolean,
   *   status: 'ACCEPTED' | 'SENT' | 'DELIVERED' | 'FAILED',
   *   channel: string,
   *   destination: string,
   *   providerMessageId: string|null,
   *   evidence: Object,
   *   error: string|null,
   *   timestamp: string
   * }>}
   */
  async send(payload) {
    throw new Error('send must be implemented by subclass');
  }
}

module.exports = { MessagingChannel };
