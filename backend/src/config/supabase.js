/**
 * AURA Backend — Supabase Client Initialization
 *
 * Server-side only. Uses service role key for full DB access.
 * NEVER exposed to frontend.
 *
 * Source: docs/05-DATABASE.md §6, docs/11-INTEGRATION-CONTRACT.md §3.2
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('./index');

let supabase = null;

/**
 * Get the Supabase client singleton.
 * Lazily initialized to allow config validation first.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function getSupabase() {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error(
        'Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }

    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabase;
}

module.exports = { getSupabase };
