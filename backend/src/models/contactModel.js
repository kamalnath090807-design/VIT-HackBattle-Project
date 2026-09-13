/**
 * AURA Backend — Contact Model
 *
 * Database access for the `contacts` and `contact_identities` tables.
 * Source: docs/05-DATABASE.md & Implementation Plan
 */

const { getSupabase } = require('../config/supabase');
const {
  contacts: fallbackContacts,
  contactIdentities: fallbackIdentities,
  uuidv4,
  isTableMissingError,
  warnMissingMigration,
} = require('./storeFallback');

const CONTACTS_TABLE = 'contacts';
const IDENTITIES_TABLE = 'contact_identities';

/**
 * Find all contacts for a specific user, including their channel identities.
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function findContactsByUser(userId) {
  try {
    const { data, error } = await getSupabase()
      .from(CONTACTS_TABLE)
      .select('*, identities:contact_identities(*)')
      .eq('user_id', userId)
      .order('display_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    if (isTableMissingError(err)) {
      warnMissingMigration(CONTACTS_TABLE);
      const userContacts = Array.from(fallbackContacts.values()).filter(
        (c) => c.user_id === userId
      );
      return userContacts.map((c) => {
        const identities = Array.from(fallbackIdentities.values()).filter(
          (i) => i.contact_id === c.id
        );
        return { ...c, identities };
      });
    }
    throw err;
  }
}

/**
 * Find a contact by ID with its identities, scoped to user.
 * @param {string} contactId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function findContactById(contactId, userId) {
  try {
    const { data, error } = await getSupabase()
      .from(CONTACTS_TABLE)
      .select('*, identities:contact_identities(*)')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      const contact = fallbackContacts.get(contactId);
      if (!contact || contact.user_id !== userId) return null;
      const identities = Array.from(fallbackIdentities.values()).filter(
        (i) => i.contact_id === contactId
      );
      return { ...contact, identities };
    }
    throw err;
  }
}

/**
 * Search contacts for a user by name or alias.
 * @param {string} userId
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
async function searchContacts(userId, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) return [];

  try {
    const { data, error } = await getSupabase()
      .from(CONTACTS_TABLE)
      .select('*, identities:contact_identities(*)')
      .eq('user_id', userId)
      .ilike('display_name', `%${normalizedQuery}%`);

    if (error) throw error;
    return data || [];
  } catch (err) {
    if (isTableMissingError(err)) {
      const userContacts = Array.from(fallbackContacts.values()).filter(
        (c) => c.user_id === userId
      );

      const matches = userContacts.filter((c) => {
        const nameMatch = c.display_name.toLowerCase().includes(normalizedQuery);
        const aliasMatch = (c.aliases || []).some((a) =>
          a.toLowerCase().includes(normalizedQuery)
        );
        return nameMatch || aliasMatch;
      });

      return matches.map((c) => {
        const identities = Array.from(fallbackIdentities.values()).filter(
          (i) => i.contact_id === c.id
        );
        return { ...c, identities };
      });
    }
    throw err;
  }
}

/**
 * Create a new contact.
 * @param {string} userId
 * @param {Object} data
 * @param {string} data.displayName
 * @param {string[]} [data.aliases]
 * @returns {Promise<Object>}
 */
async function createContact(userId, { displayName, aliases = [] }) {
  try {
    const { data, error } = await getSupabase()
      .from(CONTACTS_TABLE)
      .insert({
        user_id: userId,
        display_name: displayName,
        aliases,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      const newContact = {
        id: uuidv4(),
        user_id: userId,
        display_name: displayName,
        aliases,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fallbackContacts.set(newContact.id, newContact);
      return newContact;
    }
    throw err;
  }
}

/**
 * Add a channel identity to a contact.
 * @param {string} contactId
 * @param {Object} identity
 * @returns {Promise<Object>}
 */
async function addIdentity(contactId, identity) {
  const row = {
    contact_id: contactId,
    channel: identity.channel,
    provider: identity.provider,
    external_id: identity.externalId || identity.normalizedValue,
    normalized_value: identity.normalizedValue,
    verification_status: identity.verificationStatus || 'verified',
    source: identity.source || 'user_import',
  };

  try {
    const { data, error } = await getSupabase()
      .from(IDENTITIES_TABLE)
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      const newIdentity = {
        id: uuidv4(),
        ...row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fallbackIdentities.set(newIdentity.id, newIdentity);
      return newIdentity;
    }
    throw err;
  }
}

module.exports = {
  findContactsByUser,
  findContactById,
  searchContacts,
  createContact,
  addIdentity,
};
