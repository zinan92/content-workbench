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

    // VAL-INTAKE-007: Nested Douyin user-search pages stay unsupported
    it('returns unsupported for nested user-search URLs with /user/self/search/', () => {
      const result = classifyDouyinLink(
        'https://www.douyin.com/user/self/search/%E6%85%A2%E5%AD%A6ai?aid=8361ee96-5a5c-46a8-a327-6261655fc3f2&modal_id=7621978881326583092&type=general'
      );
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for other nested user paths', () => {
      const result = classifyDouyinLink('https://www.douyin.com/user/self/following');
      expect(result).toBe('unsupported');
    });

    it('returns unsupported for user settings-like paths', () => {
      const result = classifyDouyinLink('https://www.douyin.com/user/settings/profile');
      expect(result).toBe('unsupported');
    });
  });

  describe('adversarial hostname cases (security)', () => {
    it('rejects deceptive domain with douyin.com as subdomain prefix', () => {
      const result = classifyDouyinLink('https://douyin.com.evil.com/user/MS4wLjABAAAAtest');
      expect(result).toBe('unsupported');
    });

    it('rejects lookalike domain with douyin.com suffix', () => {
      const result = classifyDouyinLink('https://notdouyin.com/video/1234567890123456789');
      expect(result).toBe('unsupported');
    });

    it('rejects domain with douyin.com as part of longer name', () => {
      const result = classifyDouyinLink('https://mydouyin.com.fake.site/user/ABC123/');
      expect(result).toBe('unsupported');
    });

    it('rejects domain with douyin.com embedded in middle', () => {
      const result = classifyDouyinLink('https://fake-douyin.com-phishing.net/video/123');
      expect(result).toBe('unsupported');
    });

    it('rejects subdomain that looks like douyin but is not approved', () => {
      const result = classifyDouyinLink('https://phishing.douyin.com.attacker.com/user/test');
      expect(result).toBe('unsupported');
    });
  });
});
