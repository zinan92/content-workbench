'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Session, ContentItem, PrepStatus } from '@/lib/domain/types';

interface SessionData {
  session: Session;
  items: ContentItem[];
}

interface PrepItem {
  id: string;
  title: string;
  prepStatus: PrepStatus;
  prepFailureReason?: string;
  artifacts?: ContentItem['artifacts'];
}

export default function PreparationPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    
    // Poll for status updates while items are in progress
    const interval = setInterval(() => {
      loadSession();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadSession]);

  const handleRetry = useCallback(async (itemId: string) => {
    setRetrying(prev => ({ ...prev, [itemId]: true }));
    try {
      const response = await fetch(`/api/sessions/${sessionId}/prepare/${itemId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry preparation');
      }

      // Reload session to get updated status
      await loadSession();
    } catch (err) {
      console.error('Retry error:', err);
      setError('Failed to retry preparation');
    } finally {
      setRetrying(prev => ({ ...prev, [itemId]: false }));
    }
  }, [sessionId, loadSession]);

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
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">
              {error || 'Session not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { session, items } = sessionData;
  
  // Filter to only show items that are in the selected list
  const prepItems: PrepItem[] = items
    .filter(item => session.selectedIds.includes(item.id))
    .map(item => ({
      id: item.id,
      title: item.source.title,
      prepStatus: item.prepStatus,
      prepFailureReason: item.prepFailureReason,
      artifacts: item.artifacts,
    }));

  const statusCounts = prepItems.reduce((acc, item) => {
    acc[item.prepStatus] = (acc[item.prepStatus] || 0) + 1;
    return acc;
  }, {} as Record<PrepStatus, number>);

  const getStatusBadge = (status: PrepStatus) => {
    const badges: Record<PrepStatus, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      downloading: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Downloading' },
      transcribing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Transcribing' },
      ready: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    };

    const badge = badges[status];
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusIcon = (status: PrepStatus) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'downloading':
      case 'transcribing':
        return (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'ready':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Preparation Status
          </h1>
          <p className="text-sm text-gray-600">
            Preparing {prepItems.length} {prepItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {(['pending', 'downloading', 'transcribing', 'ready', 'failed'] as PrepStatus[]).map(status => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{statusCounts[status] || 0}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {prepItems.map(item => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">
                    {getStatusIcon(item.prepStatus)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h3>
                    {item.prepFailureReason && (
                      <p className="text-xs text-red-600 mt-1">
                        {item.prepFailureReason}
                      </p>
                    )}
                    {item.artifacts && (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {item.artifacts.videoPath && (
                          <div>Video: {item.artifacts.videoPath}</div>
                        )}
                        {item.artifacts.transcriptPath && (
                          <div>Transcript: {item.artifacts.transcriptPath}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  {getStatusBadge(item.prepStatus)}
                  {item.prepStatus === 'failed' && (
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={retrying[item.id]}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {retrying[item.id] ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                  {item.prepStatus === 'ready' && (
                    <a
                      href={`/items/${item.id}`}
                      className="inline-block px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      Open Studio
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {prepItems.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items to prepare</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select items from candidate review to begin preparation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
