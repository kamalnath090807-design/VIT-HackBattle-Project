/**
 * AURA Backend — Tools API Tests
 *
 * Tests GET /api/v1/tools endpoint.
 */

const request = require('supertest');

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const app = require('../../src/server');

describe('Tools API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/tools', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/tools');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('returns tool list when authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await request(app)
        .get('/api/v1/tools')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tools');
      expect(Array.isArray(res.body.data.tools)).toBe(true);
      expect(res.body.data.tools.length).toBeGreaterThan(0);
      expect(res.body.data.tools[0]).toHaveProperty('name');
      expect(res.body.data.tools[0]).toHaveProperty('description');
    });
  });
});
