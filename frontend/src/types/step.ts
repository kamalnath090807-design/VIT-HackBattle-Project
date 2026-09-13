/**
 * AURA Frontend — Task Step & Risk Types
 * Source: docs/05-DATABASE.md §3.3, docs/11-INTEGRATION-CONTRACT.md §5
 */

export type StepStatus =
  | 'PENDING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'DISALLOWED';

export interface TaskStep {
  id?: string;
  stepIndex: number;
  description: string;
  tool: string;
  params?: Record<string, any>;
  riskLevel: RiskLevel;
  status: StepStatus;
  result?: any;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}
