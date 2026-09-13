/**
 * AURA Frontend — Canonical Task Types
 * Source: docs/03-API-CONTRACT.md §5 & §6.2-6.5
 */

import { TaskStep } from './step';

export type TaskStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING'
  | 'OBSERVING'
  | 'REPLANNING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface CreateTaskResponseData {
  task: {
    id: string;
    goal: string;
    status: TaskStatus;
    createdAt: string;
  };
}

export interface TaskSummary {
  id: string;
  goal: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  stepCount?: number;
}

export interface TaskResult {
  summary: string;
  evidence: Record<string, any>;
  verified: boolean;
}

export interface Task {
  id: string;
  goal: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  currentStepIndex?: number | null;
  steps?: TaskStep[];
  plan?: {
    steps: TaskStep[];
    estimatedRisk?: string;
  };
  result?: TaskResult | null;
}
