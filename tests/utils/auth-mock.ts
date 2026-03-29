/**
 * Auth Mocking Utilities for Tests
 * 
 * Provides utilities to mock authentication in tests that use API routes
 * requiring auth. This prevents the "createServerSupabaseClient called from
 * browser context" error.
 */

import { vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

/**
 * Mock user for tests
 */
export const createMockUser = (userId = 'test-user-123'): User => ({
  id: userId,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: `${userId}@test.example.com`,
});

/**
 * Setup auth mocking for tests
 * 
 * Call this in beforeEach to mock authentication for API route tests.
 * 
 * @param userId - The user ID to mock (default: 'test-user-123')
 * @returns Cleanup function to call in afterEach
 * 
 * @example
 * ```ts
 * describe('API tests', () => {
 *   const cleanup = setupAuthMock();
 *   afterEach(cleanup);
 *   
 *   it('should work', async () => {
 *     const response = await GET(request, { params });
 *     // ...
 *   });
 * });
 * ```
 */
export function setupAuthMock(userId = 'test-user-123'): () => void {
  const mockUser = createMockUser(userId);
  
  // Mock the auth module to return our test user
  vi.mock('@/lib/auth/server', () => ({
    getCurrentUser: vi.fn().mockResolvedValue(mockUser),
    getCurrentUserId: vi.fn().mockResolvedValue(mockUser.id),
    requireUser: vi.fn().mockResolvedValue(mockUser),
    requireUserId: vi.fn().mockResolvedValue(mockUser.id),
    isAuthenticated: vi.fn().mockResolvedValue(true),
  }));
  
  return () => {
    vi.unmock('@/lib/auth/server');
    vi.restoreAllMocks();
  };
}

/**
 * Setup multi-user auth mocking for tests
 * 
 * Allows switching between different users during a test.
 * 
 * @param initialUserId - The initial user ID
 * @returns Object with setCurrentUser function and cleanup
 * 
 * @example
 * ```ts
 * describe('Multi-user tests', () => {
 *   const { setCurrentUser, cleanup } = setupMultiUserAuthMock('user-1');
 *   afterEach(cleanup);
 *   
 *   it('should isolate users', async () => {
 *     // Test as user-1
 *     await POST(request);
 *     
 *     // Switch to user-2
 *     setCurrentUser('user-2');
 *     await POST(request);
 *   });
 * });
 * ```
 */
export function setupMultiUserAuthMock(initialUserId = 'test-user-123') {
  let currentUser = createMockUser(initialUserId);
  
  const getCurrentUserMock = vi.fn().mockImplementation(() => Promise.resolve(currentUser));
  const getCurrentUserIdMock = vi.fn().mockImplementation(() => Promise.resolve(currentUser.id));
  const requireUserMock = vi.fn().mockImplementation(() => Promise.resolve(currentUser));
  const requireUserIdMock = vi.fn().mockImplementation(() => Promise.resolve(currentUser.id));
  const isAuthenticatedMock = vi.fn().mockResolvedValue(true);
  
  vi.mock('@/lib/auth/server', () => ({
    getCurrentUser: getCurrentUserMock,
    getCurrentUserId: getCurrentUserIdMock,
    requireUser: requireUserMock,
    requireUserId: requireUserIdMock,
    isAuthenticated: isAuthenticatedMock,
  }));
  
  return {
    setCurrentUser: (userId: string) => {
      currentUser = createMockUser(userId);
    },
    getCurrentUserId: () => currentUser.id,
    cleanup: () => {
      vi.unmock('@/lib/auth/server');
      vi.restoreAllMocks();
    },
  };
}

/**
 * Setup unauthenticated context for tests
 * 
 * Mocks auth to return no user, simulating signed-out state.
 */
export function setupUnauthenticatedMock(): () => void {
  vi.mock('@/lib/auth/server', () => ({
    getCurrentUser: vi.fn().mockResolvedValue(null),
    getCurrentUserId: vi.fn().mockResolvedValue(null),
    requireUser: vi.fn().mockRejectedValue(new Error('Unauthorized: Authentication required')),
    requireUserId: vi.fn().mockRejectedValue(new Error('Unauthorized: Authentication required')),
    isAuthenticated: vi.fn().mockResolvedValue(false),
  }));
  
  return () => {
    vi.unmock('@/lib/auth/server');
    vi.restoreAllMocks();
  };
}
