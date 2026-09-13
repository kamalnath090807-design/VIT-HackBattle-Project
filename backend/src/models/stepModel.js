/**
 * AURA Backend — Step Model
 *
 * Database access for the `task_steps` table.
 * Source: docs/05-DATABASE.md §3.3
 */

const { getSupabase } = require('../config/supabase');
const {
  steps,
  uuidv4,
  isTableMissingError,
  warnMissingMigration,
} = require('./storeFallback');

const TABLE = 'task_steps';

/**
 * Insert multiple steps for a task (after plan generation).
 * @param {string} taskId
 * @param {Array<Object>} stepItems - Array of step objects from the agent plan
 * @returns {Promise<Object[]>}
 */
async function bulkInsert(taskId, stepItems) {
  const rows = stepItems.map((step) => ({
    task_id: taskId,
    step_index: step.stepIndex !== undefined ? step.stepIndex : step.step_index,
    description: step.description || step.reason || `Execute ${step.tool || step.tool_name}`,
    tool_name: step.tool || step.tool_name,
    params: step.params || step.parameters || {},
    risk_level: step.riskLevel || step.risk_level || 'LOW',
    status: step.status || 'PENDING',
    result: step.result || null,
    error_message: step.error || step.error_message || null,
    started_at: step.startedAt || null,
    completed_at: step.completedAt || null,
  }));

  try {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      warnMissingMigration(TABLE);
      const inserted = rows.map((r) => {
        const item = { id: uuidv4(), ...r };
        steps.set(item.id, item);
        return item;
      });
      return inserted;
    }
    throw err;
  }
}

/**
 * Find all steps for a task, ordered by step_index.
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
async function findByTaskId(taskId) {
  try {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .select('*')
      .eq('task_id', taskId)
      .order('step_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    if (isTableMissingError(err)) {
      const taskSteps = Array.from(steps.values())
        .filter((s) => s.task_id === taskId)
        .sort((a, b) => a.step_index - b.step_index);
      return taskSteps;
    }
    throw err;
  }
}

/**
 * Update a specific step's status, result, and/or error.
 * @param {string} stepId
 * @param {Object} fields - { status, result, error_message, started_at, completed_at }
 * @returns {Promise<Object>}
 */
async function updateStep(stepId, fields) {
  try {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .update(fields)
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if (isTableMissingError(err)) {
      const step = steps.get(stepId);
      if (!step) return null;
      Object.assign(step, fields);
      steps.set(stepId, step);
      return step;
    }
    throw err;
  }
}

module.exports = {
  bulkInsert,
  findByTaskId,
  updateStep,
};
