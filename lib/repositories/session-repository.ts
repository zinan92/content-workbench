/**
 * Session Repository
 * 
 * Provides owner-scoped session persistence with feature-flagged migration
 * from filesystem to hosted Supabase storage.
 * 
 * OWNERSHIP RULES:
 * - All session operations are scoped to the authenticated user
 * - Cross-account access is blocked at the repository layer
 * - Non-owners receive null or empty results, never another user's data
 */

import type { Session, SessionId, ContentItemId } from '@/lib/domain/types';
import { useHostedPersistence } from '@/lib/config/env';
import * as workspaceStore from '@/lib/services/workspace-store';
import { readJsonFile, writeJsonFile, fileExists } from '@/lib/utils/fs';
import { getWorkspaceFile, getWorkspacesDir } from '@/lib/utils/paths';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Extended session type with owner information for persistence
 */
interface PersistedSession extends Session {
  owner_id?: string;
}

/**
 * Save a session with owner association
 * 
 * @param session - The session to save
 * @param userId - The owner's user ID
 */
export async function saveSession(session: Session, userId: string): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: store owner_id alongside session data
    const persisted: PersistedSession = {
      ...session,
      owner_id: userId,
    };
    await writeJsonFile(getWorkspaceFile(session.id), persisted);
  }
}

/**
 * Load a session only if owned by the specified user
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session ID to load
 * @returns The session if owned by user, null otherwise
 */
export async function loadOwnedSession(
  userId: string,
  sessionId: SessionId
): Promise<Session | null> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: check owner_id in persisted data
    const workspaceFile = getWorkspaceFile(sessionId);
    
    if (!(await fileExists(workspaceFile))) {
      return null;
    }
    
    const persisted = await readJsonFile<PersistedSession>(workspaceFile);
    
    // Ownership check: return null if not owned by requesting user
    if (persisted.owner_id !== userId) {
      return null;
    }
    
    // Remove owner_id before returning (not part of domain type)
    const { owner_id, ...session } = persisted;
    return session as Session;
  }
}

/**
 * Find all sessions owned by a user
 * 
 * @param userId - The user ID to filter by
 * @returns Array of sessions owned by the user
 */
export async function findOwnedSessions(userId: string): Promise<Session[]> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with RLS in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: scan workspace directories and filter by owner
    const workspacesDir = getWorkspacesDir();
    
    if (!(await fileExists(workspacesDir))) {
      return [];
    }
    
    const entries = await fs.readdir(workspacesDir, { withFileTypes: true });
    const sessionDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    const ownedSessions: Session[] = [];
    
    for (const sessionId of sessionDirs) {
      const session = await loadOwnedSession(userId, sessionId);
      if (session) {
        ownedSessions.push(session);
      }
    }
    
    // Sort by most recent first
    return ownedSessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

/**
 * Update session selection (owner-scoped mutation)
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session to update
 * @param selectedIds - The new selected item IDs
 * @throws Error if session not found or not owned by user
 */
export async function updateSessionSelection(
  userId: string,
  sessionId: SessionId,
  selectedIds: ContentItemId[]
): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with ownership check in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify ownership before updating
    const session = await loadOwnedSession(userId, sessionId);
    
    if (!session) {
      throw new Error(`Session not found or unauthorized: ${sessionId}`);
    }
    
    session.selectedIds = selectedIds;
    session.updatedAt = new Date().toISOString();
    
    await saveSession(session, userId);
  }
}

/**
 * Update session workflow phase (owner-scoped mutation)
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session to update
 * @param phase - The new workflow phase
 * @throws Error if session not found or not owned by user
 */
export async function updateSessionPhase(
  userId: string,
  sessionId: SessionId,
  phase: Session['workflowPhase']
): Promise<void> {
  if (useHostedPersistence()) {
    // TODO: Supabase implementation with ownership check in future milestone
    throw new Error('Hosted persistence not yet implemented');
  } else {
    // Legacy filesystem: verify ownership before updating
    const session = await loadOwnedSession(userId, sessionId);
    
    if (!session) {
      throw new Error(`Session not found or unauthorized: ${sessionId}`);
    }
    
    session.workflowPhase = phase;
    session.updatedAt = new Date().toISOString();
    
    await saveSession(session, userId);
  }
}

/**
 * Check if a session exists and is owned by the user
 * 
 * @param userId - The requesting user's ID
 * @param sessionId - The session ID to check
 * @returns true if session exists and is owned by user
 */
export async function sessionExistsForUser(
  userId: string,
  sessionId: SessionId
): Promise<boolean> {
  const session = await loadOwnedSession(userId, sessionId);
  return session !== null;
}
