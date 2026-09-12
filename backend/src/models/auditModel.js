/**
 * AURA Backend — Audit Log Model
 *
 * Database access for the `audit_logs` table.
 * Source: docs/05-DATABASE.md §3.5
 *
 * APPEND-ONLY: No update or delete methods exist.
 * Audit log integrity is a core security requirement.
 */

const { getSupabase } = require('../config/supabase');

const TABLE = 'audit_logs';

/**
 * Create an audit log entry (append-only).
 * @param {string} taskId
 * @param {string} action - From shared/auditActions.js
 * @param {Object} [details={}]
 * @param {number|null} [stepIndex=null]
 * @returns {Promise<Object>}
 */
async function create(taskId, action, details = {}, stepIndex = null) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      task_id: taskId,
      action,
      details,
      step_index: stepIndex,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Bulk insert audit entries (e.g., from agent execution result).
 * @param {Array<Object>} entries - Array of { task_id, action, details, step_index, timestamp }
 * @returns {Promise<Object[]>}
 */
async function bulkCreate(entries) {
  if (!entries || entries.length === 0) return [];

  const rows = entries.map((entry) => ({
    task_id: entry.taskId || entry.task_id,
    action: entry.action,
    details: entry.details || {},
    step_index: entry.stepIndex !== undefined ? entry.stepIndex : (entry.step_index || null),
    timestamp: entry.timestamp || new Date().toISOString(),
  }));

  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Find all audit entries for a task, ordered chronologically.
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
async function findByTaskId(taskId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .eq('task_id', taskId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
}

// NOTE: No update() or delete() methods — audit logs are append-only per docs/05-DATABASE.md §3.5

module.exports = {
  create,
  bulkCreate,
  findByTaskId,
};
