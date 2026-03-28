'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/domain/types';

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }
    
    loadItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Single Video Studio
          </h1>
          <p className="text-sm text-gray-600">
            {item.source.title}
          </p>
        </div>

        {/* Placeholder for two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Source of Truth */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Source Reference
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Title</h3>
                <p className="text-sm text-gray-900 mt-1">{item.source.title}</p>
              </div>
              {item.source.sourceUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Source URL</h3>
                  <p className="text-sm text-blue-600 mt-1 truncate">{item.source.sourceUrl}</p>
                </div>
              )}
              {item.artifacts?.videoPath && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Video</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.artifacts.videoPath}</p>
                </div>
              )}
              {item.artifacts?.transcriptPath && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Transcript</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.artifacts.transcriptPath}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Platform Workspace */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Platform Workspace
            </h2>
            <p className="text-sm text-gray-500">
              Platform editing tabs will be implemented in the next feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
