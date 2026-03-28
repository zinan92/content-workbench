/**
 * Discovery Adapter - MediaCrawler boundary
 * 
 * Provides a clean interface to discovery capabilities with fixture-safe defaults.
 * V1 default mode is fixtures; real MediaCrawler integration can be added later
 * without changing the service layer contract.
 */

import type { SourceMetadata } from '../domain/types';

/**
 * Discovery result from a creator profile
 */
export interface DiscoveryResult {
  candidates: SourceMetadata[];
  isPartial: boolean;
  totalFound?: number;
}

/**
 * Discovery adapter interface
 */
export interface DiscoveryAdapter {
  discoverFromCreatorProfile(profileUrl: string): Promise<DiscoveryResult>;
}

/**
 * Fixture-backed discovery adapter for stable V1 validation
 * 
 * Returns deterministic test data that exercises the full candidate review surface
 * without depending on brittle external crawler state.
 */
export class FixtureDiscoveryAdapter implements DiscoveryAdapter {
  async discoverFromCreatorProfile(_profileUrl: string): Promise<DiscoveryResult> {
    // Simulate discovery delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return fixture data representing a typical creator's recent videos
    return {
      candidates: [
        {
          title: '如何制作完美的咖啡拉花 ☕',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456789',
          publishDate: '2026-03-20T10:30:00Z',
          duration: 45,
          likes: 125000,
          comments: 3200,
          shares: 890,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '今日穿搭分享 💃',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456790',
          publishDate: '2026-03-19T15:20:00Z',
          duration: 32,
          likes: 89000,
          comments: 1800,
          shares: 420,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '新品开箱｜这款相机太惊艳了！',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456791',
          publishDate: '2026-03-18T09:15:00Z',
          duration: 120,
          likes: 256000,
          comments: 8900,
          shares: 2100,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '每日Vlog | 充实的一天',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456792',
          publishDate: '2026-03-17T18:45:00Z',
          duration: 180,
          likes: 45000,
          comments: 890,
          shares: 210,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '美食探店 | 隐藏的宝藏餐厅',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456793',
          publishDate: '2026-03-16T12:30:00Z',
          duration: 95,
          likes: 178000,
          comments: 5200,
          shares: 1300,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '旅行Vlog | 周末短途游',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456794',
          publishDate: '2026-03-15T08:00:00Z',
          duration: 240,
          likes: 312000,
          comments: 12000,
          shares: 3400,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '护肤分享 | 我的晨间护肤步骤',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456795',
          publishDate: '2026-03-14T07:30:00Z',
          duration: 68,
          likes: 95000,
          comments: 2100,
          shares: 560,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '读书分享 | 最近在看什么书',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456796',
          publishDate: '2026-03-13T20:15:00Z',
          duration: 52,
          likes: 32000,
          comments: 680,
          shares: 145,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
      ],
      isPartial: false,
      totalFound: 8,
    };
  }
}

/**
 * Partial-results fixture adapter for testing partial discovery handling
 */
export class PartialFixtureDiscoveryAdapter implements DiscoveryAdapter {
  async discoverFromCreatorProfile(_profileUrl: string): Promise<DiscoveryResult> {
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return only 3 candidates with partial flag
    return {
      candidates: [
        {
          title: '测试视频 1',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456797',
          publishDate: '2026-03-12T10:00:00Z',
          duration: 60,
          likes: 50000,
          comments: 1000,
          shares: 250,
          authorName: 'Test Creator',
          authorId: 'testuser',
        },
        {
          title: '测试视频 2',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456798',
          publishDate: '2026-03-11T14:30:00Z',
          duration: 45,
          likes: 30000,
          comments: 500,
          shares: 120,
          authorName: 'Test Creator',
          authorId: 'testuser',
        },
        {
          title: '测试视频 3',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456799',
          publishDate: '2026-03-10T09:15:00Z',
          duration: 90,
          likes: 75000,
          comments: 1500,
          shares: 380,
          authorName: 'Test Creator',
          authorId: 'testuser',
        },
      ],
      isPartial: true,
      totalFound: 15, // Indicates more exist but weren't fetched
    };
  }
}

/**
 * Discovery resolution error for supported links that fail to resolve
 */
export class DiscoveryResolutionError extends Error {
  constructor(message: string, public readonly link: string) {
    super(message);
    this.name = 'DiscoveryResolutionError';
  }
}

/**
 * Failing discovery adapter for testing resolution failures
 */
export class FailingDiscoveryAdapter implements DiscoveryAdapter {
  async discoverFromCreatorProfile(profileUrl: string): Promise<DiscoveryResult> {
    await new Promise(resolve => setTimeout(resolve, 50));
    throw new DiscoveryResolutionError(
      'Failed to resolve creator profile. The profile may be private, deleted, or temporarily unavailable.',
      profileUrl
    );
  }
}

/**
 * Get the appropriate discovery adapter based on environment configuration
 */
export function getDiscoveryAdapter(): DiscoveryAdapter {
  const mode = process.env.CONTENT_WORKBENCH_DISCOVERY_MODE || 
               process.env.CONTENT_WORKBENCH_ADAPTER_MODE ||
               'fixtures';

  if (mode === 'mediacrawler') {
    // TODO: Implement real MediaCrawler adapter when stable
    throw new Error('MediaCrawler adapter not yet implemented. Use fixtures mode for V1.');
  }

  if (mode === 'fail-on-resolution') {
    return new FailingDiscoveryAdapter();
  }

  if (mode === 'partial') {
    return new PartialFixtureDiscoveryAdapter();
  }

  // Default to fixture mode for stable V1 validation
  return new FixtureDiscoveryAdapter();
}

/**
 * Get a partial-results adapter for testing partial discovery
 */
export function getPartialDiscoveryAdapter(): DiscoveryAdapter {
  return new PartialFixtureDiscoveryAdapter();
}
