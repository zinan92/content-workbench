/**
 * CandidateTable - displays discovered videos for review and selection
 * 
 * Required columns per VAL-CANDIDATES-002:
 * - Title
 * - Publish Date
 * - Duration
 * - Likes
 * - Comments
 * - Shares
 * - Simple Score
 * - Recommended Flag
 * - Selection Control
 */

'use client';

import type { ContentItem } from '@/lib/domain/types';

interface CandidateTableProps {
  candidates: ContentItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export default function CandidateTable({
  candidates,
  selectedIds,
  onSelectionChange,
}: CandidateTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(candidates.map(c => c.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, itemId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== itemId));
    }
  };

  const allSelected = candidates.length > 0 && selectedIds.length === candidates.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < candidates.length;

  if (candidates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No candidates found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                aria-label="Select all candidates"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Published
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Duration
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              Likes
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              Comments
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              Shares
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
              Score
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
              Recommended
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            return (
              <tr
                key={candidate.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(candidate.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label={`Select ${candidate.source.title}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 font-medium">
                    {candidate.source.title}
                  </div>
                  {candidate.source.authorName && (
                    <div className="text-xs text-gray-500 mt-1">
                      {candidate.source.authorName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(candidate.source.publishDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDuration(candidate.source.duration)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                  {formatNumber(candidate.source.likes)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                  {formatNumber(candidate.source.comments)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                  {formatNumber(candidate.source.shares)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-12 h-6 text-sm font-semibold text-gray-900 bg-gray-100 rounded">
                    {candidate.simpleScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {candidate.recommended ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
                      ✓ Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Format date for display, with empty-state fallback
 */
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '—';
  
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format duration in seconds to MM:SS, with empty-state fallback
 */
function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return '—';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format large numbers with K/M suffixes, with empty-state fallback
 */
function formatNumber(value: number | undefined): string {
  if (value === undefined) return '—';
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}
