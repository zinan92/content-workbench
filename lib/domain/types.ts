/**
 * Core domain types for Content Replication Workbench
 */

/**
 * Classification result for Douyin links
 */
export type DouyinLinkType = 'creator-profile' | 'single-video' | 'unsupported';

/**
 * Preparation lifecycle status
 */
export type PrepStatus = 'pending' | 'downloading' | 'transcribing' | 'ready' | 'failed';

/**
 * Supported target platforms for replication
 */
export type Platform = 'xiaohongshu' | 'bilibili' | 'video-channel' | 'wechat-oa' | 'x';

/**
 * Stable identifier for content items
 */
export type ContentItemId = string;

/**
 * Stable identifier for sessions
 */
export type SessionId = string;

/**
 * Persisted artifact paths for a prepared item
 */
export interface PreparedArtifacts {
  videoPath?: string;
  transcriptPath?: string;
  archivePath?: string;
  analysisPath?: string;
  coverPath?: string;
}

/**
 * Platform-specific draft state
 */
export interface PlatformDraft {
  platform: Platform;
  title: string;
  body: string;
  coverNotes?: string;
  checklist: Record<string, boolean>;
  lastUpdated: string; // ISO timestamp
}

/**
 * Source metadata and engagement metrics from discovery
 */
export interface SourceMetadata {
  title: string;
  publishDate?: string;
  duration?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  sourceUrl: string;
  authorName?: string;
  authorId?: string;
}

/**
 * Content Item - represents a discovered/prepared video
 */
export interface ContentItem {
  id: ContentItemId;
  sessionId: SessionId;
  source: SourceMetadata;
  simpleScore: number;
  recommended: boolean;
  prepStatus: PrepStatus;
  prepFailureReason?: string;
  artifacts?: PreparedArtifacts;
  platformDrafts: Record<Platform, PlatformDraft>;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Session - tracks the workflow state for a link intake
 */
export interface Session {
  id: SessionId;
  inputLink: string;
  inputType: DouyinLinkType;
  candidateIds: ContentItemId[];
  selectedIds: ContentItemId[];
  workflowPhase: 'intake' | 'discovery' | 'selection' | 'preparation' | 'studio';
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Workspace - aggregates session and items for persistence
 */
export interface Workspace {
  session: Session;
  items: Record<ContentItemId, ContentItem>;
}
