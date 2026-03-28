'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Session } from '@/lib/domain/types';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data = await response.json();
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

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

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto">
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Session: {sessionId}
          </h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Input Type:</span>{' '}
              <span className="capitalize">{session.inputType.replace('-', ' ')}</span>
            </p>
            <p>
              <span className="font-medium">Phase:</span>{' '}
              <span className="capitalize">{session.workflowPhase}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Link: {session.inputLink}
            </p>
          </div>
        </div>

        {session.inputType === 'creator-profile' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-blue-900 mb-2">
              Candidate Review (Coming Soon)
            </h2>
            <p className="text-blue-800 text-sm">
              This page will show discovered candidate videos for review and selection.
            </p>
            <p className="text-blue-700 text-xs mt-3">
              Expected next: Discovery service will populate candidate table before preparation begins.
            </p>
          </div>
        )}

        {session.inputType === 'single-video' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-green-900 mb-2">
              Preparation Status (Coming Soon)
            </h2>
            <p className="text-green-800 text-sm">
              This page will show preparation progress for your single video.
            </p>
            <p className="text-green-700 text-xs mt-3">
              Expected next: Preparation service will track download/transcription status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
