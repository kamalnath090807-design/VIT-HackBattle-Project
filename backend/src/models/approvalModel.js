/**
 * AURA Backend — Approval Model
 *
 * Database access for the `approvals` table.
 * Source: docs/05-DATABASE.md §3.4
 */

const { getSupabase } = require('../config/supabase');
const {
  approvals,
  uuidv4,
  isTableMissingError,
  warnMissingMigration,
} = require('./storeFallback');

const TABLE = 'approvals';

/**
 * Create an approval request.
 * @param {string} taskId
 * @param {number} stepIndex
 * @returns {Promise<Object>}
 */
async function create(taskId, stepIndex) {
  try {
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
  } catch (err) {
    if (isTableMissingError(err)) {
      warnMissingMigration(TABLE);
      const appItem = {
        id: uuidv4(),
        task_id: taskId,
        step_index: stepIndex,
        decision: null,
        reason: null,
        requested_at: new Date().toISOString(),
        decided_at: null,
      };
      approvals.set(appItem.id, appItem);
      return appItem;
    }
    throw err;
  }
}

/**
 * Find a pending approval for a specific task and step.
 * @param {string} taskId
 * @param {number} stepIndex
 * @returns {Promise<Object|null>}
 */
async function findPending(taskId, stepIndex) {
  try {
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
  } catch (err) {
    if (isTableMissingError(err)) {
      const found = Array.from(approvals.values()).find(
        (a) => a.task_id === taskId && a.step_index === stepIndex && !a.decision
      );
      return found || null;
    }
    throw err;
  }
}

/**
 * Record the user's approval decision.
 * @param {string} approvalId
 * @param {string} decision - 'APPROVED' or 'REJECTED'
 * @param {string|null} reason
 * @returns {Promise<Object>}
 */
async function updateDecision(approvalId, decision, reason) {
  try {
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
  } catch (err) {
    if (isTableMissingError(err)) {
      const appItem = approvals.get(approvalId);
      if (!appItem) return null;
      appItem.decision = decision;
      appItem.reason = reason || null;
      appItem.decided_at = new Date().toISOString();
      approvals.set(approvalId, appItem);
      return appItem;
    }
    throw err;
  }
}

module.exports = {
  create,
  findPending,
  updateDecision,
};
