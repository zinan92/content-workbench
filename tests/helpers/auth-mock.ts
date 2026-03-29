/**
 * Auth mocking helper for tests
 * 
 * Since our route handlers now require authentication, we need to mock
 * the auth functions in tests to provide a test user ID.
 */

import { vi } from 'vitest';

export const TEST_USER_ID = 'test-user-123';

/**
 * Mock auth functions to return a test user
 * Call this in beforeEach() for API route tests
 */
export function mockAuth() {
  vi.mock('@/lib/auth/server', () => ({
    getCurrentUser: vi.fn().mockResolvedValue({ id: TEST_USER_ID }),
    getCurrentUserId: vi.fn().mockResolvedValue(TEST_USER_ID),
    requireUser: vi.fn().mockResolvedValue({ id: TEST_USER_ID }),
    requireUserId: vi.fn().mockResolvedValue(TEST_USER_ID),
    isAuthenticated: vi.fn().mockResolvedValue(true),
  }));
}

/**
 * Clear auth mocks
 * Call this in afterEach() for API route tests
 */
export function clearAuthMocks() {
  vi.unmock('@/lib/auth/server');
}
