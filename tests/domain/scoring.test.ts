/**
 * Tests for deterministic simple scoring and recommendation logic
 */

import { describe, it, expect } from 'vitest';
import { calculateSimpleScore, isRecommended } from '@/lib/domain/scoring';
import type { SourceMetadata } from '@/lib/domain/types';

describe('calculateSimpleScore', () => {
  it('calculates score from engagement metrics', () => {
    const metadata: SourceMetadata = {
      title: 'Test Video',
      sourceUrl: 'https://example.com/video',
      likes: 1000,
      comments: 100,
      shares: 50,
    };

    const score = calculateSimpleScore(metadata);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles missing engagement metrics gracefully', () => {
    const metadata: SourceMetadata = {
      title: 'Test Video',
      sourceUrl: 'https://example.com/video',
    };

    const score = calculateSimpleScore(metadata);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('rewards high engagement proportionally', () => {
    const lowEngagement: SourceMetadata = {
      title: 'Low',
      sourceUrl: 'https://example.com/1',
      likes: 10,
      comments: 1,
      shares: 0,
    };

    const highEngagement: SourceMetadata = {
      title: 'High',
      sourceUrl: 'https://example.com/2',
      likes: 10000,
      comments: 1000,
      shares: 500,
    };

    const lowScore = calculateSimpleScore(lowEngagement);
    const highScore = calculateSimpleScore(highEngagement);

    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('produces deterministic scores for identical input', () => {
    const metadata: SourceMetadata = {
      title: 'Test',
      sourceUrl: 'https://example.com/video',
      likes: 500,
      comments: 50,
      shares: 25,
    };

    const score1 = calculateSimpleScore(metadata);
    const score2 = calculateSimpleScore(metadata);

    expect(score1).toBe(score2);
  });
});

describe('isRecommended', () => {
  it('returns true for high-scoring content', () => {
    const highScore: SourceMetadata = {
      title: 'Popular Video',
      sourceUrl: 'https://example.com/video',
      likes: 100000,
      comments: 5000,
      shares: 2000,
    };

    expect(isRecommended(highScore)).toBe(true);
  });

  it('returns false for low-scoring content', () => {
    const lowScore: SourceMetadata = {
      title: 'Low Engagement',
      sourceUrl: 'https://example.com/video',
      likes: 5,
      comments: 0,
      shares: 0,
    };

    expect(isRecommended(lowScore)).toBe(false);
  });

  it('applies a consistent threshold', () => {
    const metadata: SourceMetadata = {
      title: 'Test',
      sourceUrl: 'https://example.com/video',
      likes: 1000,
      comments: 100,
      shares: 50,
    };

    const result1 = isRecommended(metadata);
    const result2 = isRecommended(metadata);

    expect(result1).toBe(result2);
  });

  it('handles missing metrics as non-recommended', () => {
    const noMetrics: SourceMetadata = {
      title: 'No Data',
      sourceUrl: 'https://example.com/video',
    };

    expect(isRecommended(noMetrics)).toBe(false);
  });
});
