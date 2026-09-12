/**
 * AURA Backend — Approval Model
 *
 * Database access for the `approvals` table.
 * Source: docs/05-DATABASE.md §3.4
 */

const { getSupabase } = require('../config/supabase');

const TABLE = 'approvals';

/**
 * Create an approval request.
 * @param {string} taskId
 * @param {number} stepIndex
 * @returns {Promise<Object>}
 */
async function create(taskId, stepIndex) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      task_id: taskId,
      step_index: stepIndex,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Find a pending approval for a specific task and step.
 * @param {string} taskId
 * @param {number} stepIndex
 * @returns {Promise<Object|null>}
 */
async function findPending(taskId, stepIndex) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .eq('task_id', taskId)
    .eq('step_index', stepIndex)
    .is('decision', null)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

/**
 * Record the user's approval decision.
 * @param {string} approvalId
 * @param {string} decision - 'APPROVED' or 'REJECTED'
 * @param {string|null} reason
 * @returns {Promise<Object>}
 */
async function updateDecision(approvalId, decision, reason) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      decision,
      reason: reason || null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  create,
  findPending,
  updateDecision,
};
