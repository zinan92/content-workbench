/**
 * Session Repository Tests
 * 
 * Tests owner-scoped session access patterns for hosted persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '@/lib/domain/types';
import { generateSessionId } from '@/lib/domain/ids';
import { fileExists } from '@/lib/utils/fs';
import { getWorkspaceFile } from '@/lib/utils/paths';
import { promises as fs } from 'fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mock feature flag to use filesystem persistence for tests
vi.mock('@/lib/config/env', () => ({
  useHostedPersistence: vi.fn(() => false),
  useHostedStorage: vi.fn(() => false),
  useHostedWorker: vi.fn(() => false),
  getSupabaseUrl: vi.fn(() => 'http://localhost:54321'),
  getSupabasePublishableKey: vi.fn(() => 'test-key'),
}));

// Import after mocking — use static import (vi.mock is hoisted above imports)
import {
  saveSession,
  loadOwnedSession,
  findOwnedSessions,
  updateSessionSelection,
} from '@/lib/repositories/session-repository';

let testDataDir: string;

describe('session-repository', () => {
  const userId1 = 'user-123';
  const userId2 = 'user-456';
  const sessionId = generateSessionId();

  const testSession: Session = {
    id: sessionId,
    inputLink: 'https://www.douyin.com/user/test',
    inputType: 'creator-profile',
    candidateIds: [],
    selectedIds: [],
    workflowPhase: 'intake',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    testDataDir = await mkdtemp(join(tmpdir(), 'session-repo-test-'));
    process.env.DATA_ROOT = testDataDir;
  });

  afterEach(async () => {
    if (testDataDir) {
      await rm(testDataDir, { recursive: true, force: true });
    }
    delete process.env.DATA_ROOT;
    vi.restoreAllMocks();
  });

  describe('saveSession', () => {
    it('should save session with owner_id when useHostedPersistence is false', async () => {
      await saveSession(testSession, userId1);
      
      // Verify filesystem persistence
      const workspaceFile = getWorkspaceFile(sessionId);
      expect(await fileExists(workspaceFile)).toBe(true);
    });
  });

  describe('loadOwnedSession', () => {
    it('should return null for non-existent session', async () => {
      const result = await loadOwnedSession(userId1, 'non-existent');
      expect(result).toBeNull();
    });

    it('should load session for the owner when useHostedPersistence is false', async () => {
      // Save session as user1
      await saveSession(testSession, userId1);
      
      // Load as owner
      const result = await loadOwnedSession(userId1, sessionId);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sessionId);
      expect(result?.inputLink).toBe(testSession.inputLink);
    });

    it('should return null for non-owner when useHostedPersistence is false', async () => {
      // Save session as user1
      await saveSession(testSession, userId1);
      
      // Try to load as user2
      const result = await loadOwnedSession(userId2, sessionId);
      expect(result).toBeNull();
    });
  });

  describe('findOwnedSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const result = await findOwnedSessions(userId1);
      expect(result).toEqual([]);
    });

    it('should return only sessions owned by the user', async () => {
      const session1 = { ...testSession, id: generateSessionId() };
      const session2 = { ...testSession, id: generateSessionId() };
      
      // Save sessions for different users
      await saveSession(session1, userId1);
      await saveSession(session2, userId2);
      
      // User1 should see only their session
      const user1Sessions = await findOwnedSessions(userId1);
      expect(user1Sessions).toHaveLength(1);
      expect(user1Sessions[0].id).toBe(session1.id);
      
      // User2 should see only their session
      const user2Sessions = await findOwnedSessions(userId2);
      expect(user2Sessions).toHaveLength(1);
      expect(user2Sessions[0].id).toBe(session2.id);
    });
  });

  describe('updateSessionSelection', () => {
    it('should update selection for owned session', async () => {
      await saveSession(testSession, userId1);
      
      const selectedIds = ['item-1', 'item-2'];
      await updateSessionSelection(userId1, sessionId, selectedIds);
      
      // Verify selection was updated
      const updated = await loadOwnedSession(userId1, sessionId);
      expect(updated?.selectedIds).toEqual(selectedIds);
    });

    it('should throw error when updating non-owned session', async () => {
      await saveSession(testSession, userId1);
      
      // User2 tries to update user1's session
      await expect(
        updateSessionSelection(userId2, sessionId, ['item-1'])
      ).rejects.toThrow(/not found|unauthorized/i);
    });

    it('should throw error when session does not exist', async () => {
      await expect(
        updateSessionSelection(userId1, 'non-existent', ['item-1'])
      ).rejects.toThrow(/not found/i);
    });
  });
});
