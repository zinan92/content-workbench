/**
 * Stable ID generation utilities
 */

import { randomBytes } from 'crypto';

/**
 * Generate a stable content item ID
 */
export function generateContentItemId(): string {
  return `item_${randomBytes(12).toString('hex')}`;
}

/**
 * Generate a stable session ID
 */
export function generateSessionId(): string {
  return `session_${randomBytes(12).toString('hex')}`;
}

/**
 * Validate content item ID format
 */
export function isValidContentItemId(id: string): boolean {
  return /^item_[0-9a-f]{24}$/.test(id);
}

/**
 * Validate session ID format
 */
export function isValidSessionId(id: string): boolean {
  return /^session_[0-9a-f]{24}$/.test(id);
}
