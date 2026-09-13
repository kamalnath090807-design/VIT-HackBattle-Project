/**
 * AURA Agent — Messaging Channels & Policy Unit Tests
 */

const { EmailAdapter } = require('../src/channels/EmailAdapter');
const { WhatsAppAdapter } = require('../src/channels/WhatsAppAdapter');
const { SMSAdapter } = require('../src/channels/SMSAdapter');
const { defaultChannelRegistry } = require('../src/channels/channelRegistry');
const { policyEngine } = require('../src/policy/policyEngine');
const { RISK_LEVELS } = require('../../shared/riskLevels');

describe('Messaging Channels', () => {
  describe('EmailAdapter', () => {
    const adapter = new EmailAdapter();

    it('validates correct email syntax', () => {
      expect(adapter.validateDestination('abishek@vithackbattle.org').valid).toBe(true);
    });

    it('rejects invalid email syntax', () => {
      expect(adapter.validateDestination('invalid-email').valid).toBe(false);
    });

    it('returns ACCEPTED status and does NOT falsely claim DELIVERED', async () => {
      const result = await adapter.send({
        destination: 'abishek@vithackbattle.org',
        message: 'Work is done.',
        recipientName: 'Abishek',
        subject: 'Status update',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.providerMessageId).toBeDefined();
      expect(result.evidence.envelopeAccepted).toBe(true);
    });
  });

  describe('WhatsAppAdapter', () => {
    const adapter = new WhatsAppAdapter();

    it('validates E.164 phone number', () => {
      expect(adapter.validateDestination('+919876543210').valid).toBe(true);
    });

    it('rejects bare phone number without international country code', () => {
      expect(adapter.validateDestination('9876543210').valid).toBe(false);
    });

    it('sends through mock Meta Cloud API adapter with ACCEPTED status', async () => {
      const result = await adapter.send({
        destination: '+919876543210',
        message: 'Work is done.',
        recipientName: 'Abishek',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.providerMessageId).toMatch(/^wamid\.HB2026/);
    });
  });

  describe('SMSAdapter', () => {
    const adapter = new SMSAdapter();

    it('validates E.164 phone number', () => {
      expect(adapter.validateDestination('+919876543210').valid).toBe(true);
    });

    it('rejects invalid phone number', () => {
      expect(adapter.validateDestination('abc').valid).toBe(false);
    });

    it('sends via mock Twilio SMS adapter with ACCEPTED status', async () => {
      const result = await adapter.send({
        destination: '+919876543210',
        message: 'I will be late.',
        recipientName: 'Abishek',
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.providerMessageId).toMatch(/^SM/);
    });
  });

  describe('ChannelRegistry', () => {
    it('retrieves registered channels case-insensitively', () => {
      expect(defaultChannelRegistry.getChannel('whatsapp')).toBeInstanceOf(WhatsAppAdapter);
      expect(defaultChannelRegistry.getChannel('EMAIL')).toBeInstanceOf(EmailAdapter);
      expect(defaultChannelRegistry.getChannel('sms')).toBeInstanceOf(SMSAdapter);
    });

    it('returns null for unknown channel', () => {
      expect(defaultChannelRegistry.getChannel('telegram')).toBeNull();
    });
  });

  describe('Policy Engine Messaging Rules', () => {
    it('determines contact_resolve as LOW risk without approval', () => {
      const decision = policyEngine.evaluateStep({
        tool: 'contact_resolve',
        parameters: { name: 'Abishek' },
      });
      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(false);
      expect(decision.riskLevel).toBe(RISK_LEVELS.LOW);
    });

    it('determines send_message as HIGH risk requiring mandatory human approval', () => {
      const decision = policyEngine.evaluateStep({
        tool: 'send_message',
        parameters: {
          recipientName: 'Abishek',
          channel: 'whatsapp',
          destination: '+919876543210',
          message: 'Work is done.',
        },
      });
      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(true);
      expect(decision.riskLevel).toBe(RISK_LEVELS.HIGH);
    });

    it('blocks send_message if destination phone lacks country code', () => {
      const decision = policyEngine.evaluateStep({
        tool: 'send_message',
        parameters: {
          recipientName: 'Abishek',
          channel: 'whatsapp',
          destination: '9876543210',
          message: 'Work is done.',
        },
      });
      expect(decision.allowed).toBe(false);
      expect(decision.riskLevel).toBe(RISK_LEVELS.DISALLOWED);
      expect(decision.error).toBe('INVALID_DESTINATION_FORMAT');
    });
  });
});
+