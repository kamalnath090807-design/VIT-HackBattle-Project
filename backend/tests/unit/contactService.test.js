/**
 * AURA Backend — Contact Service Unit Tests
 */

const contactService = require('../../src/services/contactService');

describe('ContactService', () => {
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  describe('normalizeEmail', () => {
    it('normalizes valid emails to lowercase and trimmed', () => {
      expect(contactService.normalizeEmail('  Abishek@Example.COM  ')).toBe('abishek@example.com');
    });

    it('throws on invalid email syntax', () => {
      expect(() => contactService.normalizeEmail('not-an-email')).toThrow('Invalid email address format');
      expect(() => contactService.normalizeEmail('@missinguser.com')).toThrow();
    });
  });

  describe('normalizePhone', () => {
    it('normalizes valid international phone numbers to E.164', () => {
      expect(contactService.normalizePhone('+91 98765-43210')).toBe('+919876543210');
      expect(contactService.normalizePhone('+1 (555) 019-2831')).toBe('+15550192831');
    });

    it('throws on bare phone numbers missing country codes', () => {
      expect(() => contactService.normalizePhone('9876543210')).toThrow('country code is required');
    });
  });

  describe('resolveContact', () => {
    it('resolves exact match for Abishek with all verified channels', async () => {
      const result = await contactService.resolveContact(TEST_USER_ID, 'Abishek');
      expect(result.confidence).toBe('EXACT');
      expect(result.resolvedContact).toBeDefined();
      expect(result.resolvedContact.displayName).toBe('Abishek');
      expect(result.availableChannels.whatsapp.available).toBe(true);
      expect(result.availableChannels.email.available).toBe(true);
      expect(result.availableChannels.sms.available).toBe(true);
    });

    it('resolves by alias "abi"', async () => {
      const result = await contactService.resolveContact(TEST_USER_ID, 'abi');
      expect(result.confidence).toBe('EXACT');
      expect(result.resolvedContact.displayName).toBe('Abishek');
    });

    it('returns NONE when no contact matches', async () => {
      const result = await contactService.resolveContact(TEST_USER_ID, 'UnknownPerson');
      expect(result.confidence).toBe('NONE');
      expect(result.resolvedContact).toBeNull();
      expect(result.matches).toHaveLength(0);
    });
  });
});
