/**
 * Preparation Adapter - Downloader boundary
 * 
 * Provides a clean interface to download/transcription capabilities with fixture-safe defaults.
 * V1 default mode is fixtures with persisted local outputs; real douyin-downloader-1 integration
 * can be added later without changing the service layer contract.
 */

import type { PreparedArtifacts, ContentItemId } from '../domain/types';

/**
 * Preparation result for a single item
 */
export interface PreparationResult {
  itemId: ContentItemId;
  status: 'ready' | 'failed';
  artifacts?: PreparedArtifacts;
  failureReason?: string;
}

/**
 * Progress callback for lifecycle updates
 */
export type ProgressCallback = (itemId: ContentItemId, status: 'downloading' | 'transcribing') => void;

/**
 * Preparation adapter interface
 */
export interface PreparationAdapter {
  prepareVideo(
    itemId: ContentItemId,
    sourceUrl: string,
    onProgress?: ProgressCallback
  ): Promise<PreparationResult>;
}

/**
 * Fixture-backed preparation adapter for stable V1 validation
 * 
 * Returns deterministic local artifact paths that simulate successful preparation
 * without depending on brittle external downloader/transcription state.
 */
export class FixturePreparationAdapter implements PreparationAdapter {
  async prepareVideo(
    itemId: ContentItemId,
    sourceUrl: string,
    onProgress?: ProgressCallback
  ): Promise<PreparationResult> {
    // Simulate downloading phase
    if (onProgress) {
      onProgress(itemId, 'downloading');
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate transcribing phase
    if (onProgress) {
      onProgress(itemId, 'transcribing');
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return fixture artifact paths
    return {
      itemId,
      status: 'ready',
      artifacts: {
        videoPath: `/data/artifacts/${itemId}/video.mp4`,
        transcriptPath: `/data/artifacts/${itemId}/transcript.txt`,
        archivePath: `/data/artifacts/${itemId}/archive.json`,
        analysisPath: `/data/artifacts/${itemId}/analysis.json`,
        coverPath: `/data/artifacts/${itemId}/cover.jpg`,
      },
    };
  }
}

/**
 * Mixed-outcomes adapter for testing isolated failures
 * 
 * Videos with 'FAIL_ME' in URL will fail; others succeed.
 */
export class MixedOutcomesPreparationAdapter implements PreparationAdapter {
  async prepareVideo(
    itemId: ContentItemId,
    sourceUrl: string,
    onProgress?: ProgressCallback
  ): Promise<PreparationResult> {
    // Check if this should fail
    const shouldFail = sourceUrl.includes('FAIL_ME');

    if (shouldFail) {
      // Simulate some progress before failure
      if (onProgress) {
        onProgress(itemId, 'downloading');
      }
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        itemId,
        status: 'failed',
        failureReason: 'Failed to download video: Video is private or unavailable',
      };
    }

    // Normal success path
    if (onProgress) {
      onProgress(itemId, 'downloading');
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    if (onProgress) {
      onProgress(itemId, 'transcribing');
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      itemId,
      status: 'ready',
      artifacts: {
        videoPath: `/data/artifacts/${itemId}/video.mp4`,
        transcriptPath: `/data/artifacts/${itemId}/transcript.txt`,
        archivePath: `/data/artifacts/${itemId}/archive.json`,
      },
    };
  }
}

/**
 * Get the appropriate preparation adapter based on environment configuration
 */
export function getPreparationAdapter(): PreparationAdapter {
  const mode = process.env.CONTENT_WORKBENCH_PREP_MODE || 
               process.env.CONTENT_WORKBENCH_ADAPTER_MODE ||
               'fixtures';

  if (mode === 'douyin-downloader') {
    // TODO: Implement real downloader adapter when stable
    throw new Error('Downloader adapter not yet implemented. Use fixtures mode for V1.');
  }

  if (mode === 'mixed-outcomes') {
    return new MixedOutcomesPreparationAdapter();
  }

  // Default to fixture mode for stable V1 validation
  return new FixturePreparationAdapter();
}
