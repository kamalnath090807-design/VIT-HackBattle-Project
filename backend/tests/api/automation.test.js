/**
 * AURA Backend — Automation API Tests
 *
 * Tests GET /api/v1/automation endpoints.
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

describe('Automation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('GET /api/v1/automation/system', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/automation/system');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('returns system metrics with auth', async () => {
      const res = await request(app)
        .get('/api/v1/automation/system')
        .set('Authorization', 'Bearer aura-demo-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('metrics');
      expect(res.body.data.metrics).toHaveProperty('cpuPercent');
      expect(res.body.data.metrics).toHaveProperty('ramPercent');
      expect(res.body.data).toHaveProperty('summary');
    });
  });

  describe('GET /api/v1/automation/mobile', () => {
    test('returns mobile telemetry and adbEndpoint', async () => {
      const res = await request(app)
        .get('/api/v1/automation/mobile')
        .set('Authorization', 'Bearer aura-demo-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('adbEndpoint');
      expect(res.body.data).toHaveProperty('batteryPercent');
    });
  });

  describe('GET /api/v1/automation/memory', () => {
    test('returns memory profile and facts', async () => {
      const res = await request(app)
        .get('/api/v1/automation/memory')
        .set('Authorization', 'Bearer aura-demo-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('factsCount');
    });
  });

  describe('POST /api/v1/automation/productivity/expense', () => {
    test('validates required fields', async () => {
      const res = await request(app)
        .post('/api/v1/automation/productivity/expense')
        .set('Authorization', 'Bearer aura-demo-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('records expense successfully', async () => {
      const res = await request(app)
        .post('/api/v1/automation/productivity/expense')
        .set('Authorization', 'Bearer aura-demo-token')
        .send({ amount: 450, description: 'Hosting renewal', category: 'cloud' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.amount).toBe(450);
      expect(res.body.data).toHaveProperty('monthlyTotal');
    });
  });
});
