/**
 * Deterministic simple scoring and recommendation logic
 * 
 * This module implements transparent, non-AI scoring based on
 * engagement metrics (likes, comments, shares).
 */

import type { SourceMetadata } from './types';

/**
 * Weight factors for engagement metrics
 */
const WEIGHTS = {
  likes: 1,
  comments: 5,    // Comments indicate deeper engagement
  shares: 10,     // Shares indicate highest engagement
};

/**
 * Recommendation threshold (simple score >= this value)
 */
const RECOMMENDATION_THRESHOLD = 60;

/**
 * Calculate a simple engagement score (0-100) based on metrics
 * 
 * Uses a deterministic formula that weights engagement signals:
 * - Shares are weighted highest (viral potential)
 * - Comments are weighted medium (active engagement)
 * - Likes are weighted lowest (passive engagement)
 * 
 * The score is normalized to 0-100 using a logarithmic scale
 * to handle the wide range of engagement numbers.
 */
export function calculateSimpleScore(metadata: SourceMetadata): number {
  const likes = metadata.likes ?? 0;
  const comments = metadata.comments ?? 0;
  const shares = metadata.shares ?? 0;

  // Calculate weighted engagement
  const weightedEngagement = 
    (likes * WEIGHTS.likes) +
    (comments * WEIGHTS.comments) +
    (shares * WEIGHTS.shares);

  // No engagement = 0 score
  if (weightedEngagement === 0) {
    return 0;
  }

  // Logarithmic scaling to normalize wide range of values
  // log10(1) = 0, log10(10) ≈ 1, log10(100) ≈ 2, log10(1000) ≈ 3, etc.
  // We scale by assuming log10(1000000) ≈ 6 as maximum (very viral)
  const logScore = Math.log10(weightedEngagement + 1);
  const normalized = Math.min(100, (logScore / 6) * 100);

  // Round to integer for clean display
  return Math.round(normalized);
}

/**
 * Determine if content should be recommended based on simple score
 * 
 * Uses a fixed threshold to ensure deterministic, transparent recommendation.
 * Content with score >= threshold is recommended.
 */
export function isRecommended(metadata: SourceMetadata): boolean {
  const score = calculateSimpleScore(metadata);
  return score >= RECOMMENDATION_THRESHOLD;
}
