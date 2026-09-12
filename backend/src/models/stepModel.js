/**
 * AURA Backend — Step Model
 *
 * Database access for the `task_steps` table.
 * Source: docs/05-DATABASE.md §3.3
 */

const { getSupabase } = require('../config/supabase');

const TABLE = 'task_steps';

/**
 * Insert multiple steps for a task (after plan generation).
 * @param {string} taskId
 * @param {Array<Object>} steps - Array of step objects from the agent plan
 * @returns {Promise<Object[]>}
 */
async function bulkInsert(taskId, steps) {
  const rows = steps.map((step) => ({
    task_id: taskId,
    step_index: step.stepIndex,
    description: step.description,
    tool_name: step.tool,
    params: step.params || {},
    risk_level: step.riskLevel || 'LOW',
    status: step.status || 'PENDING',
    result: step.result || null,
    error_message: step.error || null,
    started_at: step.startedAt || null,
    completed_at: step.completedAt || null,
  }));

  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Find all steps for a task, ordered by step_index.
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
async function findByTaskId(taskId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .eq('task_id', taskId)
    .order('step_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update a specific step's status, result, and/or error.
 * @param {string} stepId
 * @param {Object} fields - { status, result, error_message, started_at, completed_at }
 * @returns {Promise<Object>}
 */
async function updateStep(stepId, fields) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(fields)
    .eq('id', stepId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  bulkInsert,
  findByTaskId,
  updateStep,
};
