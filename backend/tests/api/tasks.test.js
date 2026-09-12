/**
 * AURA Backend — Tasks API Tests
 *
 * Tests POST/GET /api/v1/tasks endpoints.
 * Uses mocked Supabase — no real DB calls.
 */

const request = require('supertest');

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() =>
    Promise.resolve({
      data: {
        id: 'task-uuid-123',
        user_id: mockUser.id,
        goal: 'Test goal',
        status: 'QUEUED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    })
  ),
  then: undefined,
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

// Helper: mock successful auth
function setupAuth() {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
}

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/v1/tasks ─────────────────────────────────────────

  describe('POST /api/v1/tasks', () => {
    test('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ goal: 'Test goal' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('returns 400 for empty goal', async () => {
      setupAuth();

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({ goal: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 for missing goal', async () => {
      setupAuth();

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 201 for valid task creation', async () => {
      setupAuth();

      // Mock the insert chain to return data with select().single()
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'task-uuid-new',
          user_id: mockUser.id,
          goal: 'Check weather in Chennai',
          status: 'QUEUED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({ goal: 'Check weather in Chennai' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task).toHaveProperty('id');
      expect(res.body.data.task.status).toBe('QUEUED');
    });
  });

  // ─── GET /api/v1/tasks ──────────────────────────────────────────

  describe('GET /api/v1/tasks', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/v1/tasks/:taskId ───────────────────────────────────

  describe('GET /api/v1/tasks/:taskId', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('returns 400 for invalid UUID format', async () => {
      setupAuth();
      const res = await request(app)
        .get('/api/v1/tasks/not-a-valid-uuid')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 404 when task not found', async () => {
      setupAuth();
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const res = await request(app)
        .get('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });

  // ─── POST /api/v1/tasks/:taskId/cancel ───────────────────────────

  describe('POST /api/v1/tasks/:taskId/cancel', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).post('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000/cancel');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('returns 400 for invalid UUID', async () => {
      setupAuth();
      const res = await request(app)
        .post('/api/v1/tasks/invalid-id/cancel')
        .set('Authorization', 'Bearer test-token');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── POST /api/v1/tasks/:taskId/approve ──────────────────────────

  describe('POST /api/v1/tasks/:taskId/approve', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000/approve')
        .send({ stepIndex: 0, decision: 'APPROVED' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('returns 400 for invalid decision value', async () => {
      setupAuth();
      const res = await request(app)
        .post('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000/approve')
        .set('Authorization', 'Bearer test-token')
        .send({ stepIndex: 0, decision: 'MAYBE' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 for negative stepIndex', async () => {
      setupAuth();
      const res = await request(app)
        .post('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000/approve')
        .set('Authorization', 'Bearer test-token')
        .send({ stepIndex: -1, decision: 'APPROVED' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── 404 for unknown routes ─────────────────────────────────────

  describe('Unknown routes', () => {
    test('returns 404 for unknown path', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
