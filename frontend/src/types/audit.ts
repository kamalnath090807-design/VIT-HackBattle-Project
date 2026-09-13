/**
 * AURA Frontend — Audit Log Types
 * Source: docs/03-API-CONTRACT.md §6.7
 */

export interface AuditLogEntry {
  id: string;
  taskId: string;
  stepIndex?: number | null;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AuditTrailResponseData {
  auditTrail: AuditLogEntry[];
}
