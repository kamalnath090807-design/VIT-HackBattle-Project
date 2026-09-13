/**
 * AURA Backend — In-Memory Store Fallback
 *
 * Provides a resilient memory store when Supabase tables have not yet been
 * migrated in the remote database (e.g. before running 001_initial_schema.sql).
 * Automatically logs a reminder to run the migration in Supabase SQL editor.
 */

const { v4: uuidv4 } = require('uuid');

const tasks = new Map();
const steps = new Map();
const approvals = new Map();
const auditLogs = new Map();
const contacts = new Map();
const contactIdentities = new Map();

// Seed initial verified contacts for demo user
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

function seedInitialContacts() {
  const abishekContactId = 'c0010000-0000-0000-0000-000000000001';
  contacts.set(abishekContactId, {
    id: abishekContactId,
    user_id: DEMO_USER_ID,
    display_name: 'Abishek',
    aliases: ['abi', 'abishek'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-whatsapp-001', {
    id: 'id-whatsapp-001',
    contact_id: abishekContactId,
    channel: 'whatsapp',
    provider: 'meta',
    external_id: '+919042629740',
    normalized_value: '+919042629740',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-email-001', {
    id: 'id-email-001',
    contact_id: abishekContactId,
    channel: 'email',
    provider: 'smtp',
    external_id: 'abi323728@gmail.com',
    normalized_value: 'abi323728@gmail.com',
    verification_status: 'verified',
    source: 'authorized_email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-sms-001', {
    id: 'id-sms-001',
    contact_id: abishekContactId,
    channel: 'sms',
    provider: 'twilio',
    external_id: '+919042629740',
    normalized_value: '+919042629740',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Kamal
  const kamalContactId = 'c0010000-0000-0000-0000-000000000002';
  contacts.set(kamalContactId, {
    id: kamalContactId,
    user_id: DEMO_USER_ID,
    display_name: 'Kamal',
    aliases: ['kamalnath', 'kamal'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-email-002', {
    id: 'id-email-002',
    contact_id: kamalContactId,
    channel: 'email',
    provider: 'smtp',
    external_id: 'kamal@aura.team',
    normalized_value: 'kamal@aura.team',
    verification_status: 'verified',
    source: 'authorized_email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-whatsapp-002', {
    id: 'id-whatsapp-002',
    contact_id: kamalContactId,
    channel: 'whatsapp',
    provider: 'meta',
    external_id: '+919876543210',
    normalized_value: '+919876543210',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Manoj L
  const manojContactId = 'c0010000-0000-0000-0000-000000000003';
  contacts.set(manojContactId, {
    id: manojContactId,
    user_id: DEMO_USER_ID,
    display_name: 'Manoj L',
    aliases: ['manoj', 'manoj kumar', 'potta', 'manoj potta'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-email-003', {
    id: 'id-email-003',
    contact_id: manojContactId,
    channel: 'email',
    provider: 'smtp',
    external_id: 'manoj@aura.team',
    normalized_value: 'manoj@aura.team',
    verification_status: 'verified',
    source: 'authorized_email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-whatsapp-003', {
    id: 'id-whatsapp-003',
    contact_id: manojContactId,
    channel: 'whatsapp',
    provider: 'meta',
    external_id: '+919944478049',
    normalized_value: '+919944478049',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-sms-003', {
    id: 'id-sms-003',
    contact_id: manojContactId,
    channel: 'sms',
    provider: 'twilio',
    external_id: '+919944478049',
    normalized_value: '+919944478049',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Balasupramani
  const balaContactId = 'c0010000-0000-0000-0000-000000000004';
  contacts.set(balaContactId, {
    id: balaContactId,
    user_id: DEMO_USER_ID,
    display_name: 'Balasupramani',
    aliases: ['bala', 'balasubramani', 'balasubramanian'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-whatsapp-004', {
    id: 'id-whatsapp-004',
    contact_id: balaContactId,
    channel: 'whatsapp',
    provider: 'meta',
    external_id: '+919363898685',
    normalized_value: '+919363898685',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-sms-004', {
    id: 'id-sms-004',
    contact_id: balaContactId,
    channel: 'sms',
    provider: 'twilio',
    external_id: '+919363898685',
    normalized_value: '+919363898685',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-email-004', {
    id: 'id-email-004',
    contact_id: balaContactId,
    channel: 'email',
    provider: 'smtp',
    external_id: 'bala@aura.team',
    normalized_value: 'bala@aura.team',
    verification_status: 'verified',
    source: 'authorized_email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Elango
  const elangoContactId = 'c0010000-0000-0000-0000-000000000005';
  contacts.set(elangoContactId, {
    id: elangoContactId,
    user_id: DEMO_USER_ID,
    display_name: 'Elango',
    aliases: ['elango', 'elango skcet'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-whatsapp-005', {
    id: 'id-whatsapp-005',
    contact_id: elangoContactId,
    channel: 'whatsapp',
    provider: 'meta',
    external_id: '+918248136168',
    normalized_value: '+918248136168',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  contactIdentities.set('id-sms-005', {
    id: 'id-sms-005',
    contact_id: elangoContactId,
    channel: 'sms',
    provider: 'twilio',
    external_id: '+918248136168',
    normalized_value: '+918248136168',
    verification_status: 'verified',
    source: 'user_import',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

seedInitialContacts();

let warned = false;

function isTableMissingError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

function warnMissingMigration(tableName) {
  if (!warned) {
    warned = true;
    console.warn(
      `\n[DB] Notice: Remote Supabase table "${tableName}" does not exist yet.` +
      `\n[DB] Using resilient in-memory store for active session.` +
      `\n[DB] To persist data in Supabase, execute backend/db/migrations/001_initial_schema.sql in the Supabase SQL Editor.\n`
    );
  }
}

module.exports = {
  tasks,
  steps,
  approvals,
  auditLogs,
  contacts,
  contactIdentities,
  uuidv4,
  isTableMissingError,
  warnMissingMigration,
};
