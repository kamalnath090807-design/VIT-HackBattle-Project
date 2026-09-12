/**
 * AURA Backend — Auth API Tests
 *
 * Tests POST /api/v1/auth/register and POST /api/v1/auth/login.
 */

const request = require('supertest');

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  auth: {
    getUser: jest.fn(),
    admin: {
      createUser: jest.fn(),
    },
    signInWithPassword: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const app = require('../../src/server');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/v1/auth/register ────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    test('returns 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 for short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 201 for successful registration', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'new@example.com' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe('new-user-id');
      expect(res.body.data.email).toBe('new@example.com');
    });
  });

  // ─── POST /api/v1/auth/login ───────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    test('returns 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 401 for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('returns 200 with token for valid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-id', email: 'test@example.com' },
          session: { access_token: 'jwt-token-abc' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('jwt-token-abc');
      expect(res.body.data.userId).toBe('user-id');
    });
  });
});
