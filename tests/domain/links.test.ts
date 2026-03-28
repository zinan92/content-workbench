/**
 * Tests for Douyin link classification
 */

import { describe, it, expect } from 'vitest';
import { classifyDouyinLink } from '../../lib/domain/links';

describe('classifyDouyinLink', () => {
  describe('creator-profile links', () => {
    it('classifies douyin.com user profile URLs', () => {
      const result = classifyDouyinLink('https://www.douyin.com/user/MS4wLjABAAAA...');
      expect(result).toBe('creator-profile');
    });

    it('classifies v.douyin.com user URLs', () => {
      const result = classifyDouyinLink('https://v.douyin.com/user/ABC123/');
      expect(result).toBe('creator-profile');
    });

    it('handles user URLs without trailing slash', () => {
      const result = classifyDouyinLink('https://www.douyin.com/user/MS4wLjABAAAA');
      expect(result).toBe('creator-profile');
    });
  });

  describe('single-video links', () => {
    it('classifies douyin.com video URLs', () => {
      const result = classifyDouyinLink('https://www.douyin.com/video/1234567890123456789');
      expect(result).toBe('single-video');
    });

    it('classifies v.douyin.com short video URLs', () => {
      const result = classifyDouyinLink('https://v.douyin.com/ieFvABC/');
      expect(result).toBe('single-video');
    });

    it('handles video URLs without trailing slash', () => {
      const result = classifyDouyinLink('https://www.douyin.com/video/9876543210987654321');
      expect(result).toBe('single-video');
    });
  });

  describe('unsupported inputs', () => {
    it('returns unsupported for non-Douyin URLs', () => {
      const result = classifyDouyinLink('https://www.youtube.com/watch?v=abc');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for malformed URLs', () => {
      const result = classifyDouyinLink('not-a-url');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for empty string', () => {
      const result = classifyDouyinLink('');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for Douyin search URLs', () => {
      const result = classifyDouyinLink('https://www.douyin.com/search/abc');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for Douyin live URLs', () => {
      const result = classifyDouyinLink('https://www.douyin.com/live/abc');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for other Douyin paths', () => {
      const result = classifyDouyinLink('https://www.douyin.com/discover');
      expect(result).toBe('unsupported');
    });
  });
});
