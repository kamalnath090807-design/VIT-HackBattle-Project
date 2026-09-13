/**
 * AURA Backend — Contacts API Integration Tests
 */

const request = require('supertest');

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const mockUser = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'judge@vithackbattle.org' };

const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => Promise.reject({ code: 'PGRST205', message: 'could not find table' })),
  ilike: jest.fn(() => Promise.reject({ code: 'PGRST205', message: 'could not find table' })),
  single: jest.fn(() => Promise.reject({ code: 'PGRST205', message: 'could not find table' })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const app = require('../../src/server');

function setupAuth() {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
}

describe('Contacts API (/api/v1/contacts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuth();
  });

  describe('GET /api/v1/contacts', () => {
    it('returns 401 without auth token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
      const res = await request(app).get('/api/v1/contacts');
      expect(res.status).toBe(401);
    });

    it('returns list of verified contacts for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.contacts)).toBe(true);
      const abishek = res.body.data.contacts.find((c) => c.displayName === 'Abishek');
      expect(abishek).toBeDefined();
      expect(abishek.identities.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/contacts/resolve', () => {
    it('resolves verified contact name with exact confidence', async () => {
      const res = await request(app)
        .get('/api/v1/contacts/resolve?name=Abishek')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.confidence).toBe('EXACT');
      expect(res.body.data.resolvedContact.displayName).toBe('Abishek');
      expect(res.body.data.availableChannels.whatsapp.available).toBe(true);
      expect(res.body.data.availableChannels.email.available).toBe(true);
    });

    it('returns NONE when no matching contact exists', async () => {
      const res = await request(app)
        .get('/api/v1/contacts/resolve?name=GhostUser')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.confidence).toBe('NONE');
      expect(res.body.data.resolvedContact).toBeNull();
    });

    it('returns 400 when name query parameter is missing', async () => {
      const res = await request(app)
        .get('/api/v1/contacts/resolve')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(400);
    });
  });
});
