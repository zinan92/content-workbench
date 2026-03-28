/**
 * Path utilities for workspace structure
 */

import path from 'path';

/**
 * Get the root data directory for the workspace
 */
export function getDataRoot(): string {
  return path.resolve(process.cwd(), 'data');
}

/**
 * Get the workspaces directory
 */
export function getWorkspacesDir(): string {
  return path.join(getDataRoot(), 'workspaces');
}

/**
 * Get the directory for a specific session
 */
export function getSessionDir(sessionId: string): string {
  return path.join(getWorkspacesDir(), sessionId);
}

/**
 * Get the workspace file path for a session
 */
export function getWorkspaceFile(sessionId: string): string {
  return path.join(getSessionDir(sessionId), 'workspace.json');
}

/**
 * Get the items directory for a session
 */
export function getItemsDir(sessionId: string): string {
  return path.join(getSessionDir(sessionId), 'items');
}

/**
 * Get the file path for a specific content item
 */
export function getItemFile(sessionId: string, itemId: string): string {
  return path.join(getItemsDir(sessionId), `${itemId}.json`);
}
