/**
 * Douyin link classification logic
 */

import type { DouyinLinkType } from './types';

/**
 * Classify a Douyin link into creator-profile, single-video, or unsupported
 */
export function classifyDouyinLink(input: string): DouyinLinkType {
  // Handle empty or malformed input
  if (!input || typeof input !== 'string') {
    return 'unsupported';
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return 'unsupported';
  }

  // Parse as URL
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return 'unsupported';
  }

  // Check if it's a Douyin domain
  const hostname = url.hostname.toLowerCase();
  if (!hostname.includes('douyin.com')) {
    return 'unsupported';
  }

  // Extract pathname
  const pathname = url.pathname;

  // Match creator-profile patterns
  // Examples:
  // - https://www.douyin.com/user/MS4wLjABAAAA...
  // - https://v.douyin.com/user/ABC123/
  if (pathname.startsWith('/user/')) {
    return 'creator-profile';
  }

  // Match single-video patterns
  // Examples:
  // - https://www.douyin.com/video/1234567890123456789
  // - https://v.douyin.com/ieFvABC/ (short links)
  if (pathname.startsWith('/video/')) {
    return 'single-video';
  }

  // v.douyin.com short links that don't have /video/ or /user/ prefix
  // These are typically video share links like https://v.douyin.com/ieFvABC/
  if (hostname === 'v.douyin.com' && pathname !== '/' && !pathname.startsWith('/user/')) {
    // Assume short links are videos (most common case)
    return 'single-video';
  }

  // All other Douyin paths are unsupported in V1
  return 'unsupported';
}
