/**
 * AURA Frontend — API Envelope & Error Types
 * Source: docs/03-API-CONTRACT.md §4
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
