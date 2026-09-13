/**
 * AURA Backend — Contact Service
 *
 * Implements Unified Contact Identity, Safe Normalization,
 * and Deterministic Resolution with Ambiguity Detection.
 * Source: docs/02-ARCHITECTURE.md & Implementation Plan
 */

const contactModel = require('../models/contactModel');
const logger = require('../utils/logger');

/**
 * Normalize an email address.
 * Converts to lowercase, trims whitespace, validates RFC syntax.
 * @param {string} email
 * @returns {string} Normalized email
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error(`Invalid email address format: "${email}"`);
  }
  return cleaned;
}

/**
 * Normalize a phone number to international E.164 format.
 * Strips dashes, spaces, parentheses.
 * Retains leading '+' and country code.
 * Rejects bare phone numbers lacking country code to avoid ambiguity.
 * @param {string} phone
 * @returns {string} Normalized E.164 phone
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  // Remove formatting characters
  let cleaned = phone.replace(/[\s\(\)\-\.]/g, '');

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Enforce E.164 format: + followed by 8-15 digits
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  if (!e164Regex.test(cleaned)) {
    // If lacks +, do NOT guess country code
    throw new Error(
      `Phone number "${phone}" is not in valid international E.164 format (e.g. +919042629740). A country code is required.`
    );
  }

  return cleaned;
}

/**
 * Normalize a contact display name or alias.
 * @param {string} name
 * @returns {string}
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Resolve a natural language name to a verified contact record.
 * Detects ambiguity and returns structured channel availability.
 *
 * @param {string} userId - Requesting user ID
 * @param {string} naturalQuery - Name query (e.g. "Abishek")
 * @returns {Promise<{
 *   confidence: 'EXACT' | 'AMBIGUOUS' | 'NONE',
 *   resolvedContact: Object|null,
 *   matches: Object[],
 *   availableChannels: Record<string, { available: boolean, destination: string, status: string }>,
 *   message: string
 * }>}
 */
async function resolveContact(userId, naturalQuery) {
  const query = normalizeName(naturalQuery);
  if (!query) {
    return {
      confidence: 'NONE',
      resolvedContact: null,
      matches: [],
      availableChannels: {},
      message: 'No contact name specified.',
    };
  }

  const rawMatches = await contactModel.searchContacts(userId, query);

  // 1. If no matches found in DB/Store, check synced device contacts from contactEngine
  if (!rawMatches || rawMatches.length === 0) {
    try {
      const contactEngine = require('../../../core/contactEngine');
      const deviceMatch = contactEngine.resolveContact(query);
      if (deviceMatch && deviceMatch.phone) {
        const phone = deviceMatch.phone;
        const chMap = {
          whatsapp: { available: true, destination: phone, status: 'verified', source: 'device_import' },
          sms: { available: true, destination: phone, status: 'verified', source: 'device_import' },
          email: { available: !!deviceMatch.email, destination: deviceMatch.email || null, status: 'verified', source: 'device_import' },
        };
        const sum = { id: `dev-${phone}`, displayName: deviceMatch.name, aliases: deviceMatch.aliases || [] };
        return {
          confidence: 'EXACT',
          resolvedContact: sum,
          matches: [sum],
          availableChannels: chMap,
          phone,
          message: `Resolved contact "${deviceMatch.name}" from mobile device.`,
        };
      }
    } catch (_) {}

    logger.info('ContactService', `No contact found for query: "${query}"`, { userId });
    return {
      confidence: 'NONE',
      resolvedContact: null,
      matches: [],
      availableChannels: {},
      message: `I could not find any contact named "${query}". Please check the contact list or add the contact first.`,
    };
  }

  // 2. Check for exact display_name or alias match
  const exactMatches = rawMatches.filter((c) => {
    const isExactName = c.display_name.toLowerCase() === query.toLowerCase();
    const isExactAlias = (c.aliases || []).some((a) => a.toLowerCase() === query.toLowerCase());
    return isExactName || isExactAlias;
  });

  // Exactly one exact match found
  if (exactMatches.length === 1) {
    const contact = exactMatches[0];
    const availableChannels = buildChannelMap(contact.identities || []);
    return {
      confidence: 'EXACT',
      resolvedContact: formatContactSummary(contact),
      matches: [formatContactSummary(contact)],
      availableChannels,
      message: `Resolved contact "${contact.display_name}".`,
    };
  }

  // Multiple exact matches or multiple candidates -> AMBIGUOUS
  const candidates = (exactMatches.length > 1 ? exactMatches : rawMatches).map(formatContactSummary);
  const candidateNames = candidates.map((c) => c.displayName).join(', ');

  logger.warn('ContactService', `Ambiguous contact match for "${query}"`, {
    matchCount: candidates.length,
    candidates: candidateNames,
  });

  return {
    confidence: 'AMBIGUOUS',
    resolvedContact: null,
    matches: candidates,
    availableChannels: {},
    message: `I found ${candidates.length} contacts matching "${query}": ${candidateNames}. Which one do you mean?`,
  };
}

/**
 * Format channel map from identities.
 */
function buildChannelMap(identities) {
  const map = {
    whatsapp: { available: false, destination: null, status: null },
    email: { available: false, destination: null, status: null },
    sms: { available: false, destination: null, status: null },
  };

  for (const ident of identities) {
    const channel = (ident.channel || '').toLowerCase();
    if (map[channel]) {
      map[channel] = {
        available: ident.verification_status === 'verified',
        destination: ident.normalized_value,
        status: ident.verification_status,
        source: ident.source,
      };
    }
  }

  return map;
}

/**
 * Format public contact summary.
 */
function formatContactSummary(c) {
  return {
    id: c.id,
    displayName: c.display_name,
    aliases: c.aliases || [],
    identities: (c.identities || []).map((i) => ({
      id: i.id,
      channel: i.channel,
      provider: i.provider,
      destination: i.normalized_value,
      verificationStatus: i.verification_status,
      source: i.source,
    })),
  };
}

/**
 * List contacts for a user.
 * @param {string} userId
 */
async function listContacts(userId) {
  const list = await contactModel.findContactsByUser(userId);
  return list.map(formatContactSummary);
}

/**
 * Create a verified contact with channel identities.
 * @param {string} userId
 * @param {Object} data
 */
async function createContact(userId, data) {
  const displayName = normalizeName(data.displayName);
  if (!displayName) {
    throw new Error('Contact display name is required.');
  }

  const aliases = (data.aliases || []).map(normalizeName).filter(Boolean);
  const contact = await contactModel.createContact(userId, { displayName, aliases });

  // Add identities if supplied
  if (Array.isArray(data.identities)) {
    for (const ident of data.identities) {
      let normalizedValue = ident.value;
      if (ident.channel === 'email') {
        normalizedValue = normalizeEmail(ident.value);
      } else if (ident.channel === 'whatsapp' || ident.channel === 'sms') {
        normalizedValue = normalizePhone(ident.value);
      }

      await contactModel.addIdentity(contact.id, {
        channel: ident.channel,
        provider: ident.provider || (ident.channel === 'email' ? 'smtp' : 'twilio'),
        normalizedValue,
        verificationStatus: ident.verificationStatus || 'verified',
        source: ident.source || 'user_import',
      });
    }
  }

  return contactModel.findContactById(contact.id, userId);
}

module.exports = {
  normalizeEmail,
  normalizePhone,
  normalizeName,
  resolveContact,
  listContacts,
  createContact,
};
