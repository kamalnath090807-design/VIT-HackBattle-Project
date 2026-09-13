/**
 * AURA — Contact Engine
 * Resolves natural language contact queries to real phone numbers & channels
 * with direct synchronization from Android ADB Content Provider.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');
const PHONE_CONTACTS_FILE = path.join(__dirname, '..', 'data', 'phone_contacts.json');

// Built-in team and common aliases mapped to device contact keys
const KNOWN_ALIASES = {
  manoj: ['potta', 'manoj potta', 'manoj kumar', 'manoj l'],
  elango: ['elango skcet'],
  bala: ['balasupramani', 'balasubramani', 'balasubramanian'],
  abishek: ['abhishek', 'abi'],
  kamal: ['kamalesh', 'kamalesh kamaraj', 'kamalnath'],
  appa: ['father', 'dad'],
};

function normalizeText(str) {
  if (!str) return '';
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function loadContacts() {
  const result = [];
  const seenPhones = new Set();

  // 1. Load curated/team contacts first
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const curated = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
      for (const c of curated) {
        result.push(c);
        if (c.phone) seenPhones.add(c.phone.replace(/[^\d+]/g, ''));
      }
    }
  } catch (err) {
    console.error('[ContactEngine] Error reading contacts.json:', err);
  }

  // 2. Load synced phone contacts from device
  try {
    if (fs.existsSync(PHONE_CONTACTS_FILE)) {
      const deviceContacts = JSON.parse(fs.readFileSync(PHONE_CONTACTS_FILE, 'utf8'));
      for (const dc of deviceContacts) {
        const cleanPhone = (dc.phone || '').replace(/[^\d+]/g, '');
        if (!seenPhones.has(cleanPhone)) {
          const normName = normalizeText(dc.name || dc.rawName);
          const lowerName = normName.toLowerCase();
          const aliases = [];

          // Associate known aliases if matches
          for (const [key, aliasList] of Object.entries(KNOWN_ALIASES)) {
            if (lowerName.includes(key)) {
              aliases.push(...aliasList);
            }
          }

          result.push({
            name: normName,
            rawName: dc.rawName,
            phone: cleanPhone,
            aliases,
            isDeviceContact: true,
          });
          seenPhones.add(cleanPhone);
        }
      }
    }
  } catch (err) {
    console.error('[ContactEngine] Error reading phone_contacts.json:', err);
  }

  return result;
}

/**
 * Synchronize real contacts directly from the connected Android phone over ADB
 */
async function syncPhoneContacts() {
  const phoneEngine = require('./phoneEngine');
  try {
    const res = await phoneEngine.runAdb([
      'shell',
      'content',
      'query',
      '--uri',
      'content://contacts/phones/',
      '--projection',
      'display_name:number',
    ]);

    if (!res || !res.stdout) return { success: false, message: 'No contact data returned from ADB' };

    const lines = res.stdout.split(/\r?\n/);
    const contacts = [];

    for (const line of lines) {
      const m = line.match(/display_name=(.+?),\s*number=(.+)$/);
      if (m) {
        const rawName = m[1].trim();
        const rawNum = m[2].trim();
        const cleanNum = rawNum.replace(/[^\d+]/g, '');
        if (cleanNum.length >= 7) {
          contacts.push({
            rawName,
            name: normalizeText(rawName),
            phone: cleanNum.startsWith('+') ? cleanNum : `+91${cleanNum.replace(/^0/, '')}`,
          });
        }
      }
    }

    fs.writeFileSync(PHONE_CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');
    console.log(`[ContactEngine] Synced ${contacts.length} contacts from device.`);
    return { success: true, count: contacts.length, contacts };
  } catch (err) {
    console.error('[ContactEngine] Failed to sync phone contacts:', err);
    return { success: false, error: err.message };
  }
}

function resolveContact(target) {
  if (!target || typeof target !== 'string') return null;
  const q = normalizeText(target).toLowerCase();
  if (!q) return null;

  const contacts = loadContacts();

  // 1. Direct name match (case-insensitive)
  for (const c of contacts) {
    if (normalizeText(c.name).toLowerCase() === q) return c;
  }

  // 2. Alias match
  for (const c of contacts) {
    if (Array.isArray(c.aliases)) {
      for (const a of c.aliases) {
        if (normalizeText(a).toLowerCase() === q) return c;
      }
    }
  }

  // 3. Substring / Word boundary match
  for (const c of contacts) {
    const cName = normalizeText(c.name).toLowerCase();
    if (cName.includes(q) || q.includes(cName)) {
      return c;
    }
    if (Array.isArray(c.aliases)) {
      for (const a of c.aliases) {
        const aNorm = normalizeText(a).toLowerCase();
        if (aNorm.includes(q) || q.includes(aNorm)) {
          return c;
        }
      }
    }
  }

  // 4. Check if target is already a phone number
  const digits = target.replace(/[^\d+]/g, '');
  if (digits.length >= 7) {
    return { name: target, phone: digits.startsWith('+') ? digits : `+91${digits}` };
  }

  return null;
}

module.exports = {
  loadContacts,
  resolveContact,
  syncPhoneContacts,
  normalizeText,
};
