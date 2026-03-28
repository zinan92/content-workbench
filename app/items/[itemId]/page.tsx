'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ContentItem, Platform } from '@/lib/domain/types';

// Platform display metadata
const PLATFORMS: Array<{ id: Platform; label: string; description: string }> = [
  { id: 'xiaohongshu', label: 'XiaoHongShu', description: 'Little Red Book' },
  { id: 'bilibili', label: 'Bilibili', description: 'Video platform' },
  { id: 'video-channel', label: 'Video Channel', description: 'WeChat Video' },
  { id: 'wechat-oa', label: 'WeChat OA', description: 'Official Account' },
  { id: 'x', label: 'X', description: 'Twitter/X' },
];

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('xiaohongshu');
  const [drafts, setDrafts] = useState<Record<Platform, { title: string; body: string; coverNotes: string }>>({
    xiaohongshu: { title: '', body: '', coverNotes: '' },
    bilibili: { title: '', body: '', coverNotes: '' },
    'video-channel': { title: '', body: '', coverNotes: '' },
    'wechat-oa': { title: '', body: '', coverNotes: '' },
    x: { title: '', body: '', coverNotes: '' },
  });

  useEffect(() => {
    async function loadItem() {
      try {
        const response = await fetch(`/api/items/${itemId}`);
        
        if (response.status === 403) {
          const data = await response.json();
          setError(data.error || 'Item is not ready for studio access');
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to load item');
        }
        
        const data = await response.json();
        setItem(data.item);
        
        // Initialize drafts from loaded item
        const loadedDrafts: Record<Platform, { title: string; body: string; coverNotes: string }> = {
          xiaohongshu: { title: '', body: '', coverNotes: '' },
          bilibili: { title: '', body: '', coverNotes: '' },
          'video-channel': { title: '', body: '', coverNotes: '' },
          'wechat-oa': { title: '', body: '', coverNotes: '' },
          x: { title: '', body: '', coverNotes: '' },
        };
        
        PLATFORMS.forEach(({ id }) => {
          const platformDraft = data.item.platformDrafts[id];
          if (platformDraft) {
            loadedDrafts[id] = {
              title: platformDraft.title || '',
              body: platformDraft.body || '',
              coverNotes: platformDraft.coverNotes || '',
            };
          }
        });
        
        setDrafts(loadedDrafts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }
    
    loadItem();
  }, [itemId]);

  const handleDraftChange = (platform: Platform, field: 'title' | 'body' | 'coverNotes', value: string) => {
    setDrafts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading studio...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  const activeDraft = drafts[activePlatform];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Single Video Studio</h1>
            <p className="text-sm text-gray-600 mt-1">{item.source.title}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Back to Preparation
          </button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Source of Truth */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Reference</h2>
            </div>

            {/* Video Preview */}
            {item.artifacts?.videoPath ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Video Preview</h3>
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center text-sm text-gray-600">
                  <div className="text-center">
                    <p className="mb-1">📹 Video Preview</p>
                    <p className="text-xs text-gray-500">{item.artifacts.videoPath}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Video Preview</h3>
                <div className="bg-gray-50 rounded-lg aspect-video flex items-center justify-center text-sm text-gray-400">
                  No video available
                </div>
              </div>
            )}

            {/* Source Metadata */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Metadata</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="text-sm text-gray-900 mt-1">{item.source.title}</p>
                </div>
                {item.source.authorName && (
                  <div>
                    <p className="text-xs text-gray-500">Author</p>
                    <p className="text-sm text-gray-900 mt-1">{item.source.authorName}</p>
                  </div>
                )}
                {item.source.publishDate && (
                  <div>
                    <p className="text-xs text-gray-500">Published</p>
                    <p className="text-sm text-gray-900 mt-1">{new Date(item.source.publishDate).toLocaleDateString()}</p>
                  </div>
                )}
                {item.source.duration !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm text-gray-900 mt-1">{Math.floor(item.source.duration / 60)}:{String(item.source.duration % 60).padStart(2, '0')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Source URL</p>
                  <a
                    href={item.source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1 block truncate"
                  >
                    {item.source.sourceUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            {(item.source.likes !== undefined || item.source.comments !== undefined || item.source.shares !== undefined) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Engagement</h3>
                <div className="grid grid-cols-3 gap-3">
                  {item.source.likes !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.likes.toLocaleString()}</p>
                    </div>
                  )}
                  {item.source.comments !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.comments.toLocaleString()}</p>
                    </div>
                  )}
                  {item.source.shares !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.shares.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript */}
            {item.artifacts?.transcriptPath ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p className="text-xs text-gray-500 mb-2">Available at:</p>
                  <p className="text-xs font-mono break-all">{item.artifacts.transcriptPath}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400">
                  No transcript available
                </div>
              </div>
            )}

            {/* Source Context */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Source Context</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Score:</span>
                  <span className="font-medium text-gray-900">{item.simpleScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recommended:</span>
                  <span className={`font-medium ${item.recommended ? 'text-green-600' : 'text-gray-600'}`}>
                    {item.recommended ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Platform Workspace */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Platform Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              {PLATFORMS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActivePlatform(id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activePlatform === id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {PLATFORMS.find(p => p.id === activePlatform)?.label} Draft
                </h2>
                <p className="text-sm text-gray-500">
                  {PLATFORMS.find(p => p.id === activePlatform)?.description}
                </p>
              </div>

              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={activeDraft.title}
                  onChange={(e) => handleDraftChange(activePlatform, 'title', e.target.value)}
                  placeholder="Enter title for this platform..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Body/Caption Field */}
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                  {activePlatform === 'x' ? 'Tweet Text' : 'Caption / Description'}
                </label>
                <textarea
                  id="body"
                  value={activeDraft.body}
                  onChange={(e) => handleDraftChange(activePlatform, 'body', e.target.value)}
                  placeholder="Enter caption or description..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Cover/Visual Notes */}
              <div>
                <label htmlFor="coverNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover / Visual Notes
                </label>
                <textarea
                  id="coverNotes"
                  value={activeDraft.coverNotes}
                  onChange={(e) => handleDraftChange(activePlatform, 'coverNotes', e.target.value)}
                  placeholder="Notes about cover image, thumbnails, or other visual elements..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Manual notes for cover images, thumbnails, or visual considerations for this platform.
                </p>
              </div>

              {/* Save indicator (placeholder for future persistence) */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Draft changes are tracked locally. Persistence will be implemented in the next feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
