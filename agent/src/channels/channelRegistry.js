/**
 * AURA Agent — Channel Registry
 *
 * Central access point for messaging channels.
 * Source: Implementation Plan §E
 */

const { EmailAdapter } = require('./EmailAdapter');
const { WhatsAppAdapter } = require('./WhatsAppAdapter');
const { SMSAdapter } = require('./SMSAdapter');

class ChannelRegistry {
  constructor() {
    this.channels = new Map();
    this.registerChannel(new EmailAdapter());
    this.registerChannel(new WhatsAppAdapter());
    this.registerChannel(new SMSAdapter());
  }

  registerChannel(channel) {
    this.channels.set(channel.getChannelName(), channel);
  }

  getChannel(channelName) {
    if (!channelName) return null;
    return this.channels.get(channelName.toLowerCase()) || null;
  }

  listChannels() {
    return Array.from(this.channels.keys());
  }
}

const defaultChannelRegistry = new ChannelRegistry();

module.exports = {
  ChannelRegistry,
  defaultChannelRegistry,
};
