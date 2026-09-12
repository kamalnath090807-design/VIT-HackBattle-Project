/**
 * AURA Backend — Task Model
 *
 * Database access for the `tasks` table.
 * Source: docs/05-DATABASE.md §3.2
 *
 * All queries filter by user_id for per-user isolation.
 * State values imported from shared/taskStates.js — never redefined.
 */

const { getSupabase } = require('../config/supabase');
const { ALL_TASK_STATES } = require('../../../shared/taskStates');

const TABLE = 'tasks';

/**
 * Create a new task.
 * @param {string} userId
 * @param {string} goal
 * @returns {Promise<Object>} Created task row
 */
async function create(userId, goal) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      user_id: userId,
      goal,
      status: 'QUEUED',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Find a task by ID, scoped to the owning user.
 * Returns null if not found or not owned by the user.
 * @param {string} taskId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function findById(taskId, userId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null; // Row not found
  if (error) throw error;
  return data;
}

/**
 * List tasks for a user with optional status filter and pagination.
 * @param {string} userId
 * @param {Object} options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @returns {Promise<{tasks: Object[], total: number}>}
 */
async function findByUserId(userId, { status, limit = 20, offset = 0 } = {}) {
  let query = getSupabase()
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ALL_TASK_STATES.includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { tasks: data || [], total: count || 0 };
}

/**
 * Update a task's status and optional additional fields.
 * @param {string} taskId
 * @param {string} status
 * @param {Object} [additionalFields] - e.g., { current_step_index, completed_at }
 * @returns {Promise<Object>}
 */
async function updateStatus(taskId, status, additionalFields = {}) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...additionalFields,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the plan JSONB field.
 * @param {string} taskId
 * @param {Object} plan
 * @returns {Promise<Object>}
 */
async function updatePlan(taskId, plan) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the result JSONB and completion timestamp.
 * @param {string} taskId
 * @param {Object} result
 * @param {string} completedAt - ISO timestamp
 * @returns {Promise<Object>}
 */
async function updateResult(taskId, result, completedAt) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      result,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  create,
  findById,
  findByUserId,
  updateStatus,
  updatePlan,
  updateResult,
};
