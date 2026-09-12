/**
 * AURA Backend — Audit API Tests
 *
 * Tests GET /api/v1/tasks/:taskId/audit endpoint.
 */

const request = require('supertest');

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
  auth: {
    getUser: jest.fn(),
    admin: { createUser: jest.fn() },
    signInWithPassword: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const app = require('../../src/server');

describe('GET /api/v1/tasks/:taskId/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get(
      '/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000/audit'
    );
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('returns 400 for invalid UUID', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const res = await request(app)
      .get('/api/v1/tasks/not-a-uuid/audit')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
