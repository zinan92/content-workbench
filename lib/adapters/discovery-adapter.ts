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
  resolveSingleVideo(videoUrl: string): Promise<SourceMetadata>;
}

/**
 * Fixture-backed discovery adapter for stable V1 validation
 * 
 * Returns deterministic test data that exercises the full candidate review surface
 * without depending on brittle external crawler state.
 */
export class FixtureDiscoveryAdapter implements DiscoveryAdapter {
  async resolveSingleVideo(videoUrl: string): Promise<SourceMetadata> {
    // Simulate resolution delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Extract video ID from URL for deterministic fixture data
    const urlParts = videoUrl.split('/');
    const videoIdPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    // Return fixture metadata for the single video
    return {
      title: `Single Video Content - ${videoIdPart.substring(0, 8)}`,
      sourceUrl: videoUrl,
      publishDate: new Date().toISOString(),
      duration: 60,
      likes: 50000,
      comments: 1200,
      shares: 350,
      authorName: 'Video Creator',
      authorId: 'single-video-author',
    };
  }

  async discoverFromCreatorProfile(_profileUrl: string): Promise<DiscoveryResult> {
    // Simulate discovery delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return fixture data representing a typical creator's recent videos
    // Mix of high-engagement (recommended) and low-engagement (not recommended) content
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
          title: '随手拍 | 路边的小花',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456792',
          publishDate: '2026-03-17T18:45:00Z',
          duration: 15,
          likes: 2500,
          comments: 45,
          shares: 8,
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
          title: '日常碎片 | 办公室的下午茶时光',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456795',
          publishDate: '2026-03-14T07:30:00Z',
          duration: 22,
          likes: 3200,
          comments: 68,
          shares: 12,
          authorName: 'Coffee Master',
          authorId: 'user123',
        },
        {
          title: '读书分享 | 最近在看什么书',
          sourceUrl: 'https://www.douyin.com/video/7234567890123456796',
          publishDate: '2026-03-13T20:15:00Z',
          duration: 52,
          likes: 4500,
          comments: 95,
          shares: 18,
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
  async resolveSingleVideo(videoUrl: string): Promise<SourceMetadata> {
    return new FixtureDiscoveryAdapter().resolveSingleVideo(videoUrl);
  }

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
  async resolveSingleVideo(videoUrl: string): Promise<SourceMetadata> {
    await new Promise(resolve => setTimeout(resolve, 50));
    throw new DiscoveryResolutionError(
      'Failed to resolve video. The video may be private, deleted, or temporarily unavailable.',
      videoUrl
    );
  }

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
