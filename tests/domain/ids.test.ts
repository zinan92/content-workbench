/**
 * Tests for stable ID generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateContentItemId,
  generateSessionId,
  isValidContentItemId,
  isValidSessionId,
} from '../../lib/domain/ids';

describe('ID Generation', () => {
  it('should generate unique content item IDs', () => {
    const id1 = generateContentItemId();
    const id2 = generateContentItemId();
    const id3 = generateContentItemId();
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate content item IDs with correct format', () => {
    const id = generateContentItemId();
    
    expect(id).toMatch(/^item_[0-9a-f]{24}$/);
    expect(isValidContentItemId(id)).toBe(true);
  });

  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    const id3 = generateSessionId();
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate session IDs with correct format', () => {
    const id = generateSessionId();
    
    expect(id).toMatch(/^session_[0-9a-f]{24}$/);
    expect(isValidSessionId(id)).toBe(true);
  });
});

describe('ID Validation', () => {
  it('should validate correct content item IDs', () => {
    expect(isValidContentItemId('item_123456789012345678901234')).toBe(true);
    expect(isValidContentItemId('item_abcdef123456789012345678')).toBe(true);
  });

  it('should reject invalid content item IDs', () => {
    expect(isValidContentItemId('item_')).toBe(false);
    expect(isValidContentItemId('item_12345')).toBe(false);
    expect(isValidContentItemId('session_123456789012345678901234')).toBe(false);
    expect(isValidContentItemId('item_12345678901234567890123g')).toBe(false); // non-hex
    expect(isValidContentItemId('item_1234567890123456789012345')).toBe(false); // too long
  });

  it('should validate correct session IDs', () => {
    expect(isValidSessionId('session_123456789012345678901234')).toBe(true);
    expect(isValidSessionId('session_abcdef123456789012345678')).toBe(true);
  });

  it('should reject invalid session IDs', () => {
    expect(isValidSessionId('session_')).toBe(false);
    expect(isValidSessionId('session_12345')).toBe(false);
    expect(isValidSessionId('item_123456789012345678901234')).toBe(false);
    expect(isValidSessionId('session_12345678901234567890123g')).toBe(false); // non-hex
    expect(isValidSessionId('session_1234567890123456789012345')).toBe(false); // too long
  });
});
