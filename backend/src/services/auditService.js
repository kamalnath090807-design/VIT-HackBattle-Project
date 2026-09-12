/**
 * AURA Backend — Audit Service
 *
 * Thin wrapper around auditModel for consistent audit entry creation.
 * Used by taskService, approvalService, and the agent integration adapter.
 *
 * Source: docs/02-ARCHITECTURE.md §12
 */

const auditModel = require('../models/auditModel');
const logger = require('../utils/logger');

/**
 * Log a single audit entry.
 * @param {string} taskId
 * @param {string} action - From shared/auditActions.js
 * @param {Object} [details={}]
 * @param {number|null} [stepIndex=null]
 * @returns {Promise<Object>}
 */
async function log(taskId, action, details = {}, stepIndex = null) {
  try {
    return await auditModel.create(taskId, action, details, stepIndex);
  } catch (err) {
    // Audit logging failure should not crash the request,
    // but MUST be logged server-side for investigation
    logger.error('AuditService', `Failed to write audit entry: ${action}`, err);
    return null;
  }
}

/**
 * Bulk-log audit entries (e.g., from agent execution result).
 * @param {Array<Object>} entries
 * @returns {Promise<Object[]>}
 */
async function bulkLog(entries) {
  try {
    return await auditModel.bulkCreate(entries);
  } catch (err) {
    logger.error('AuditService', `Failed to bulk-write ${entries.length} audit entries`, err);
    return [];
  }
}

/**
 * Get all audit entries for a task.
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
async function getByTaskId(taskId) {
  return auditModel.findByTaskId(taskId);
}

module.exports = { log, bulkLog, getByTaskId };
