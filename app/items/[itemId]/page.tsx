'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ContentItem, Platform } from '@/lib/domain/types';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

// Platform display metadata — uses translation keys
const PLATFORM_IDS: Platform[] = ['xiaohongshu', 'bilibili', 'video-channel', 'wechat-oa', 'x'];

function usePlatforms() {
  const { t } = useLocale();

  return PLATFORM_IDS.map(id => {
    switch (id) {
      case 'xiaohongshu':
        return {
          id,
          label: t('platform.xiaohongshu'),
          description: t('platform.xiaohongshu.desc'),
          minimumOutputs: [t('platform.xiaohongshu.out1'), t('platform.xiaohongshu.out2'), t('platform.xiaohongshu.out3')],
          checklistItems: [
            { key: 'search-title-written', label: t('platform.xiaohongshu.check1') },
            { key: 'caption-adapted', label: t('platform.xiaohongshu.check2') },
            { key: 'cover-selected', label: t('platform.xiaohongshu.check3') },
            { key: 'ready-to-publish', label: t('platform.readyToPublish') },
          ],
        };
      case 'bilibili':
        return {
          id,
          label: t('platform.bilibili'),
          description: t('platform.bilibili.desc'),
          minimumOutputs: [t('platform.bilibili.out1'), t('platform.bilibili.out2')],
          checklistItems: [
            { key: 'title-updated', label: t('platform.bilibili.check1') },
            { key: 'description-written', label: t('platform.bilibili.check2') },
            { key: 'ready-to-publish', label: t('platform.readyToPublish') },
          ],
        };
      case 'video-channel':
        return {
          id,
          label: t('platform.videoChannel'),
          description: t('platform.videoChannel.desc'),
          minimumOutputs: [t('platform.bilibili.out1'), t('platform.bilibili.out2')],
          checklistItems: [
            { key: 'title-updated', label: t('platform.bilibili.check1') },
            { key: 'description-written', label: t('platform.bilibili.check2') },
            { key: 'ready-to-publish', label: t('platform.readyToPublish') },
          ],
        };
      case 'wechat-oa':
        return {
          id,
          label: t('platform.wechatOa'),
          description: t('platform.wechatOa.desc'),
          minimumOutputs: [t('platform.wechatOa.out1'), t('platform.wechatOa.out2')],
          checklistItems: [
            { key: 'title-updated', label: t('platform.wechatOa.check1') },
            { key: 'body-drafted', label: t('platform.wechatOa.check2') },
            { key: 'ready-to-publish', label: t('platform.readyToPublish') },
          ],
        };
      case 'x':
        return {
          id,
          label: 'X',
          description: t('platform.x.desc'),
          minimumOutputs: [t('platform.x.out1')],
          checklistItems: [
            { key: 'post-drafted', label: t('platform.x.check1') },
            { key: 'ready-to-publish', label: t('platform.readyToPublish') },
          ],
        };
    }
  });
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const platforms = usePlatforms();
  const itemId = params.itemId as string;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [otherReadyItems, setOtherReadyItems] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('xiaohongshu');
  const [drafts, setDrafts] = useState<Record<Platform, { title: string; body: string; coverNotes: string; searchTitle: string; keyframeCandidates: string }>>({
    xiaohongshu: { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' },
    bilibili: { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' },
    'video-channel': { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' },
    'wechat-oa': { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' },
    x: { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' },
  });
  const [checklists, setChecklists] = useState<Record<Platform, Record<string, boolean>>>({
    xiaohongshu: {},
    bilibili: {},
    'video-channel': {},
    'wechat-oa': {},
    x: {},
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

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
        setOtherReadyItems(data.otherReadyItems || []);

        const emptyDraft = { title: '', body: '', coverNotes: '', searchTitle: '', keyframeCandidates: '' };
        const loadedDrafts: Record<Platform, { title: string; body: string; coverNotes: string; searchTitle: string; keyframeCandidates: string }> = {
          xiaohongshu: { ...emptyDraft },
          bilibili: { ...emptyDraft },
          'video-channel': { ...emptyDraft },
          'wechat-oa': { ...emptyDraft },
          x: { ...emptyDraft },
        };

        const loadedChecklists: Record<Platform, Record<string, boolean>> = {
          xiaohongshu: {},
          bilibili: {},
          'video-channel': {},
          'wechat-oa': {},
          x: {},
        };

        PLATFORM_IDS.forEach((id) => {
          const platformDraft = data.item.platformDrafts[id];
          if (platformDraft) {
            loadedDrafts[id] = {
              title: platformDraft.title || '',
              body: platformDraft.body || '',
              coverNotes: platformDraft.coverNotes || '',
              searchTitle: platformDraft.searchTitle || '',
              keyframeCandidates: platformDraft.keyframeCandidates || '',
            };
            loadedChecklists[id] = platformDraft.checklist || {};
          }
        });

        setDrafts(loadedDrafts);
        setChecklists(loadedChecklists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [itemId]);

  const handleDraftChange = (platform: Platform, field: 'title' | 'body' | 'coverNotes' | 'searchTitle' | 'keyframeCandidates', value: string) => {
    setDrafts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleChecklistChange = (platform: Platform, key: string, checked: boolean) => {
    setChecklists(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: checked,
      },
    }));
  };

  const handleSaveDraft = async () => {
    setSaveStatus('saving');

    try {
      const activeDraftData = drafts[activePlatform];
      const activeChecklist = checklists[activePlatform];

      const response = await fetch(`/api/items/${itemId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: activePlatform,
          title: activeDraftData.title,
          body: activeDraftData.body,
          coverNotes: activeDraftData.coverNotes,
          searchTitle: activeDraftData.searchTitle,
          keyframeCandidates: activeDraftData.keyframeCandidates,
          checklist: activeChecklist,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handlePlatformSwitch = (platform: Platform) => {
    setActivePlatform(platform);
    setSaveStatus('idle');
  };

  const handleNextPlatform = () => {
    const currentIndex = platforms.findIndex(p => p.id === activePlatform);
    const nextIndex = (currentIndex + 1) % platforms.length;
    handlePlatformSwitch(platforms[nextIndex].id);
  };

  const handleNextReadyVideo = async () => {
    if (otherReadyItems.length === 0) return;
    await handleSaveDraft();
    const nextItem = otherReadyItems[0];
    router.push(`/items/${nextItem.id}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('studio.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-sm font-medium text-red-800">{t('studio.error')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
            >
              {t('studio.goBack')}
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
          <p className="text-gray-600">{t('studio.notFound')}</p>
        </div>
      </div>
    );
  }

  const activeDraft = drafts[activePlatform];
  const currentPlatform = platforms.find(p => p.id === activePlatform);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('studio.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{item.source.title}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            {t('studio.backToPrep')}
          </button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Source of Truth */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('studio.sourceRef')}</h2>
            </div>

            {/* Video Preview */}
            {item.artifacts?.videoPath ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.videoPreview')}</h3>
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center text-sm text-gray-600">
                  <div className="text-center">
                    <p className="mb-1">{t('studio.videoPreviewIcon')}</p>
                    <p className="text-xs text-gray-500">{item.artifacts.videoPath}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.videoPreview')}</h3>
                <div className="bg-gray-50 rounded-lg aspect-video flex items-center justify-center text-sm text-gray-400">
                  {t('studio.noVideo')}
                </div>
              </div>
            )}

            {/* Source Metadata */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t('studio.metadata')}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{t('studio.metaTitle')}</p>
                  <p className="text-sm text-gray-900 mt-1">{item.source.title}</p>
                </div>
                {item.source.authorName && (
                  <div>
                    <p className="text-xs text-gray-500">{t('studio.metaAuthor')}</p>
                    <p className="text-sm text-gray-900 mt-1">{item.source.authorName}</p>
                  </div>
                )}
                {item.source.publishDate && (
                  <div>
                    <p className="text-xs text-gray-500">{t('studio.metaPublished')}</p>
                    <p className="text-sm text-gray-900 mt-1">{new Date(item.source.publishDate).toLocaleDateString()}</p>
                  </div>
                )}
                {item.source.duration !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500">{t('studio.metaDuration')}</p>
                    <p className="text-sm text-gray-900 mt-1">{Math.floor(item.source.duration / 60)}:{String(item.source.duration % 60).padStart(2, '0')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">{t('studio.metaSourceUrl')}</p>
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
            {(item.source.viewCount !== undefined || item.source.likes !== undefined || item.source.comments !== undefined || item.source.shares !== undefined) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('studio.engagement')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {item.source.viewCount !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('studio.views')}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.viewCount.toLocaleString()}</p>
                    </div>
                  )}
                  {item.source.likes !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('studio.likes')}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.likes.toLocaleString()}</p>
                    </div>
                  )}
                  {item.source.comments !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('studio.comments')}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.comments.toLocaleString()}</p>
                    </div>
                  )}
                  {item.source.shares !== undefined && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('studio.shares')}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{item.source.shares.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript */}
            {item.artifacts?.transcriptPath ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.transcript')}</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p className="text-xs text-gray-500 mb-2">{t('studio.transcriptPath')}</p>
                  <p className="text-xs font-mono break-all">{item.artifacts.transcriptPath}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.transcript')}</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400">
                  {t('studio.noTranscript')}
                </div>
              </div>
            )}

            {/* Source Context */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.sourceContext')}</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('studio.score')}</span>
                  <span className="font-medium text-gray-900">{item.simpleScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('studio.recommended')}</span>
                  <span className={`font-medium ${item.recommended ? 'text-green-600' : 'text-gray-600'}`}>
                    {item.recommended ? t('studio.yes') : t('studio.no')}
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
              {platforms.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handlePlatformSwitch(id)}
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
              {/* Platform header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {currentPlatform?.label} {t('studio.draft')}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentPlatform?.description}
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  {t('studio.minOutputs')}{currentPlatform?.minimumOutputs.join(' · ')}
                </div>
              </div>

              {/* XiaoHongShu-specific fields */}
              {activePlatform === 'xiaohongshu' && (
                <>
                  <div>
                    <label htmlFor="searchTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('xhs.searchTitle')}
                    </label>
                    <input
                      type="text"
                      id="searchTitle"
                      value={activeDraft.searchTitle}
                      onChange={(e) => handleDraftChange(activePlatform, 'searchTitle', e.target.value)}
                      placeholder={t('xhs.searchTitlePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('xhs.searchTitleHint')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('xhs.captionDraft')}
                    </label>
                    <textarea
                      id="body"
                      value={activeDraft.body}
                      onChange={(e) => handleDraftChange(activePlatform, 'body', e.target.value)}
                      placeholder={t('xhs.captionPlaceholder')}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="keyframeCandidates" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('xhs.keyframeCandidates')}
                    </label>
                    <textarea
                      id="keyframeCandidates"
                      value={activeDraft.keyframeCandidates}
                      onChange={(e) => handleDraftChange(activePlatform, 'keyframeCandidates', e.target.value)}
                      placeholder={t('xhs.keyframePlaceholder')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('xhs.keyframeHint')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="coverNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('xhs.coverNotes')}
                    </label>
                    <textarea
                      id="coverNotes"
                      value={activeDraft.coverNotes}
                      onChange={(e) => handleDraftChange(activePlatform, 'coverNotes', e.target.value)}
                      placeholder={t('xhs.coverPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Bilibili / Video Channel */}
              {(activePlatform === 'bilibili' || activePlatform === 'video-channel') && (
                <>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('repost.title')}
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={activeDraft.title}
                      onChange={(e) => handleDraftChange(activePlatform, 'title', e.target.value)}
                      placeholder={t('repost.titlePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('repost.description')}
                    </label>
                    <textarea
                      id="body"
                      value={activeDraft.body}
                      onChange={(e) => handleDraftChange(activePlatform, 'body', e.target.value)}
                      placeholder={t('repost.descriptionPlaceholder')}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* WeChat OA */}
              {activePlatform === 'wechat-oa' && (
                <>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('wechat.articleTitle')}
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={activeDraft.title}
                      onChange={(e) => handleDraftChange(activePlatform, 'title', e.target.value)}
                      placeholder={t('wechat.articleTitlePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('wechat.articleBody')}
                    </label>
                    <textarea
                      id="body"
                      value={activeDraft.body}
                      onChange={(e) => handleDraftChange(activePlatform, 'body', e.target.value)}
                      placeholder={t('wechat.articleBodyPlaceholder')}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* X */}
              {activePlatform === 'x' && (
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('x.postText')}
                  </label>
                  <textarea
                    id="body"
                    value={activeDraft.body}
                    onChange={(e) => handleDraftChange(activePlatform, 'body', e.target.value)}
                    placeholder={t('x.postPlaceholder')}
                    rows={4}
                    maxLength={280}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {activeDraft.body.length}/280 {t('x.charCount')}
                  </p>
                </div>
              )}

              {/* Checklist */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('studio.checklist')}</h3>
                <div className="space-y-2">
                  {currentPlatform?.checklistItems.map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklists[activePlatform][key] || false}
                        onChange={(e) => handleChecklistChange(activePlatform, key, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Draft Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSaveDraft}
                      disabled={saveStatus === 'saving'}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveStatus === 'saving' ? t('studio.saving') : t('studio.saveDraft')}
                    </button>

                    {saveStatus === 'success' && (
                      <p className="text-sm text-green-600">{t('studio.saved')}</p>
                    )}

                    {saveStatus === 'error' && (
                      <p className="text-sm text-red-600">{t('studio.saveFailed')}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleNextPlatform}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {t('studio.nextPlatform')}
                    </button>

                    {otherReadyItems.length > 0 && (
                      <button
                        onClick={handleNextReadyVideo}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        {t('studio.nextVideo')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
