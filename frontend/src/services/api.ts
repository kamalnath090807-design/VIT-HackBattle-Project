/**
 * AURA Frontend — Typed REST API Client
 *
 * Source: docs/03-API-CONTRACT.md
 * Exact mapping to backend Express routes under /api/v1
 */

import { ApiResponse } from '../types/api';
import { Task, TaskSummary, CreateTaskResponseData } from '../types/task';
import { ApprovalDecision, ApprovalResponseData } from '../types/approval';
import { AuditTrailResponseData } from '../types/audit';
import { ToolsResponseData } from '../types/tool';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3001/api/v1`;
  }
  return 'http://localhost:3001/api/v1';
};

const BASE_URL = getApiBaseUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('aura_auth_token') || 'aura-demo-jwt-token-hackbattle-2026';
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('aura_auth_token', token);
    } else {
      localStorage.removeItem('aura_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as Error & { code?: string; status?: number };
      err.code = json.error?.code;
      err.status = response.status;
      throw err;
    }

    return json.data as T;
  }

  // ─── Health ──────────────────────────────────────────────────────────
  async getHealth(): Promise<{ status: string; aiProvider: string; timestamp: string }> {
    return this.request('/health');
  }

  // ─── Auth ────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ user: { id: string; email: string }; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // ─── Tasks ───────────────────────────────────────────────────────────
  async createTask(goal: string): Promise<CreateTaskResponseData> {
    return this.request<CreateTaskResponseData>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    });
  }

  async listTasks(params: { status?: string; limit?: number; offset?: number } = {}): Promise<{
    tasks: TaskSummary[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.request(`/tasks${qs}`);
  }

  async getTask(taskId: string): Promise<{ task: Task }> {
    return this.request<{ task: Task }>(`/tasks/${taskId}`);
  }

  async cancelTask(taskId: string): Promise<{ task: Task }> {
    return this.request<{ task: Task }>(`/tasks/${taskId}/cancel`, {
      method: 'POST',
    });
  }

  async submitApproval(
    taskId: string,
    stepIndex: number,
    decision: ApprovalDecision,
    reason?: string
  ): Promise<ApprovalResponseData> {
    return this.request<ApprovalResponseData>(`/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ stepIndex, decision, reason }),
    });
  }

  // ─── Audit ───────────────────────────────────────────────────────────
  async getAuditLog(taskId: string): Promise<AuditTrailResponseData> {
    return this.request<AuditTrailResponseData>(`/tasks/${taskId}/audit`);
  }

  // ─── Tools ───────────────────────────────────────────────────────────
  async getTools(): Promise<ToolsResponseData> {
    return this.request<ToolsResponseData>('/tools');
  }

  // ─── Automation & Telemetry ───────────────────────────────────────────
  async getSystemMetrics(): Promise<{
    success: boolean;
    metrics: {
      cpuPercent: number;
      ramPercent: number;
      ramUsedGb: number;
      ramTotalGb: number;
      diskFreeGb: number;
      diskTotalGb: number;
    };
    summary: string;
  }> {
    return this.request('/automation/system');
  }

  async getMobileTelemetry(): Promise<{
    connected: boolean;
    batteryPercent: number;
    level?: number;
    scale?: number;
    temperatureC: number;
    voltageMv?: number;
    isCharging: boolean;
    adbEndpoint: string;
  }> {
    return this.request('/automation/mobile');
  }

  async getMemoryProfile(): Promise<{
    user: any;
    factsCount: number;
    recentFacts: Array<{ key: string; fact: string; timestamp: string }>;
    patterns: any;
  }> {
    return this.request('/automation/memory');
  }

  async getProductivityBrief(): Promise<{
    summary: string;
    weather: any;
    habits: any[];
    notes: any[];
    battery: any;
    system: any;
  }> {
    return this.request('/automation/productivity');
  }

  async logExpense(amount: number, description: string, category?: string): Promise<any> {
    return this.request('/automation/productivity/expense', {
      method: 'POST',
      body: JSON.stringify({ amount, description, category }),
    });
  }

  async storeFact(key: string, fact: string): Promise<any> {
    return this.request('/automation/memory/fact', {
      method: 'POST',
      body: JSON.stringify({ key, fact }),
    });
  }
}

export const api = new ApiClient();
