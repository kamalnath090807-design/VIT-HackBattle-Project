/**
 * AURA Frontend — Formal Approval Request & Decision Types
 * Source: docs/03-API-CONTRACT.md §6.5, docs/11-INTEGRATION-CONTRACT.md §7.2
 */

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface ApprovalRequest {
  taskId: string;
  stepIndex: number;
  tool: string;
  params: Record<string, any>;
  riskLevel: 'HIGH';
  reason: string;
}

export interface ApprovalResponseData {
  approval: {
    id: string;
    taskId: string;
    stepIndex: number;
    decision: ApprovalDecision;
    reason?: string | null;
    decidedAt: string;
  };
}
