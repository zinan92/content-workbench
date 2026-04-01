'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Session, ContentItem } from '@/lib/domain/types';
import CandidateTable from '@/components/CandidateTable';
import { useLocale } from '@/lib/i18n/locale-context';

interface SessionData {
  session: Session;
  candidates?: ContentItem[];
  isPartial?: boolean;
}

type SortField = 'title' | 'publishDate' | 'duration' | 'viewCount' | 'likes' | 'comments' | 'shares' | 'simpleScore';
type SortDirection = 'asc' | 'desc';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const sessionId = params.sessionId as string;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('simpleScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterRecommended, setFilterRecommended] = useState(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data = await response.json();

        if (data.session?.inputType === 'single-video') {
          router.push(`/sessions/${sessionId}/preparation`);
          return;
        }

        setSessionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId, router]);

  const handleSelectionChange = useCallback(async (selectedIds: string[]) => {
    if (!sessionData) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/selection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update selection');
      }

      const data = await response.json();
      setSessionData(prev => prev ? { ...prev, session: data.session } : null);
    } catch (err) {
      console.error('Selection update error:', err);
      setError('Failed to update selection');
    }
  }, [sessionId, sessionData]);

  const handlePrepareSelected = useCallback(async () => {
    if (!sessionData || sessionData.session.selectedIds.length === 0) return;

    setPreparing(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/prepare`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to prepare selected items');
      }

      router.push(`/sessions/${sessionId}/preparation`);
    } catch (err) {
      console.error('Prepare error:', err);
      setError('Failed to prepare selected items');
    } finally {
      setPreparing(false);
    }
  }, [sessionId, sessionData, router]);

  const handleSort = useCallback((field: SortField, direction: SortDirection) => {
    setSortBy(field);
    setSortDirection(direction);
  }, []);

  const handleFilterChange = useCallback((recommended: boolean) => {
    setFilterRecommended(recommended);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">{t('session.error')}</h3>
            <p className="text-sm text-red-700 mt-1">
              {error || t('session.notFound')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { session, candidates = [], isPartial = false } = sessionData;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {session.inputType === 'creator-profile' ? t('session.candidateReview') : t('session.session')}
          </h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">{t('session.inputType')}</span>
              <span className="capitalize">{session.inputType.replace('-', ' ')}</span>
            </p>
            <p>
              <span className="font-medium">{t('session.phase')}</span>
              <span className="capitalize">{session.workflowPhase}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t('session.link')}{session.inputLink}
            </p>
          </div>
        </div>

        {session.inputType === 'creator-profile' && (
          <div className="space-y-4">
            {isPartial && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t('session.partialResults')}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('session.partialResultsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {t('session.discoveredVideos')} ({candidates.length})
                </h2>
                {session.selectedIds.length > 0 && (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    onClick={handlePrepareSelected}
                    disabled={preparing}
                  >
                    {preparing ? t('session.preparing') : `${t('session.prepareSelected')} (${session.selectedIds.length})`}
                  </button>
                )}
              </div>

              <CandidateTable
                candidates={candidates}
                selectedIds={session.selectedIds}
                onSelectionChange={handleSelectionChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                filterRecommended={filterRecommended}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
