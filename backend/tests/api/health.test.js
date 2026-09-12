/**
 * AURA Backend — Health API Tests
 *
 * Tests GET /api/v1/health endpoint.
 */

const request = require('supertest');

// Must set env vars before importing app
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      admin: { createUser: jest.fn() },
      signInWithPassword: jest.fn(),
    },
  })),
}));

const app = require('../../src/server');

describe('GET /api/v1/health', () => {
  test('returns 200 with correct schema', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data).toHaveProperty('ai_provider');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  test('does not require authentication', async () => {
    const res = await request(app).get('/api/v1/health');
    // Should succeed without Authorization header
    expect(res.status).toBe(200);
  });

  test('timestamp is valid ISO string', async () => {
    const res = await request(app).get('/api/v1/health');
    const timestamp = res.body.data.timestamp;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
