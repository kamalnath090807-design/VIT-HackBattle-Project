/**
 * AURA Frontend — Tool Catalog Types
 * Source: docs/03-API-CONTRACT.md §6.8
 */

import { RiskLevel } from './step';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    required?: boolean;
    description?: string;
    enum?: string[];
  }>;
  riskLevel: RiskLevel;
  requiresApproval?: boolean;
  category?: string;
}

export interface ToolsResponseData {
  tools: ToolDefinition[];
}
