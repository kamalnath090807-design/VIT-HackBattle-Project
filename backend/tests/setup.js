/**
 * AURA Backend — Test Setup
 *
 * Mocks Supabase client and provides test helpers.
 * Source: docs/06-TESTING.md §9 (mock external APIs for testing)
 */

// Mock Supabase before any imports
const mockSupabaseData = {
  selectData: null,
  insertData: null,
  updateData: null,
  error: null,
  count: 0,
};

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(function () {
    return Promise.resolve({
      data: mockSupabaseData.selectData || mockSupabaseData.insertData || mockSupabaseData.updateData,
      error: mockSupabaseData.error,
    });
  }),
  then: undefined, // resolved via select/single
};

// Make chainable methods return resolved promises when awaited
const resolveQuery = () =>
  Promise.resolve({
    data: mockSupabaseData.selectData,
    error: mockSupabaseData.error,
    count: mockSupabaseData.count,
  });

// Override select to also be thenable
mockQueryBuilder.select.mockImplementation(function (...args) {
  const builder = { ...mockQueryBuilder };
  builder.then = (resolve) =>
    resolve({
      data: mockSupabaseData.selectData,
      error: mockSupabaseData.error,
      count: mockSupabaseData.count,
    });
  return builder;
});

const mockSupabase = {
  from: jest.fn(() => mockQueryBuilder),
  auth: {
    getUser: jest.fn(),
    admin: {
      createUser: jest.fn(),
    },
    signInWithPassword: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// ─── Test Helpers ────────────────────────────────────────────────────

/**
 * Generate a valid-looking Bearer token for testing.
 * @returns {string}
 */
function getTestToken() {
  return 'test-jwt-token-' + Date.now();
}

/**
 * Set up auth mock to accept any token and return a test user.
 * @param {string} [userId='test-user-id-123']
 */
function mockAuthSuccess(userId = 'test-user-id-123') {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: 'test@example.com',
      },
    },
    error: null,
  });
}

/**
 * Set up auth mock to reject tokens.
 */
function mockAuthFailure() {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Invalid token' },
  });
}

/**
 * Reset all mocks between tests.
 */
function resetMocks() {
  jest.clearAllMocks();
  mockSupabaseData.selectData = null;
  mockSupabaseData.insertData = null;
  mockSupabaseData.updateData = null;
  mockSupabaseData.error = null;
  mockSupabaseData.count = 0;
}

module.exports = {
  mockSupabase,
  mockSupabaseData,
  mockQueryBuilder,
  getTestToken,
  mockAuthSuccess,
  mockAuthFailure,
  resetMocks,
};
