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
import { useMemo } from 'react';

type SortField = 'title' | 'publishDate' | 'duration' | 'viewCount' | 'likes' | 'comments' | 'shares' | 'simpleScore';
type SortDirection = 'asc' | 'desc';

interface CandidateTableProps {
  candidates: ContentItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  sortBy?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField, direction: SortDirection) => void;
  filterRecommended?: boolean;
  onFilterChange?: (filterRecommended: boolean) => void;
}

export default function CandidateTable({
  candidates,
  selectedIds,
  onSelectionChange,
  sortBy,
  sortDirection = 'desc',
  onSort,
  filterRecommended = false,
  onFilterChange,
}: CandidateTableProps) {
  // Apply filtering
  const filteredCandidates = useMemo(() => {
    if (!filterRecommended) return candidates;
    return candidates.filter(c => c.recommended);
  }, [candidates, filterRecommended]);

  // Apply sorting
  const sortedCandidates = useMemo(() => {
    if (!sortBy) return filteredCandidates;

    const sorted = [...filteredCandidates].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === 'title') {
        aValue = a.source.title || '';
        bValue = b.source.title || '';
      } else if (sortBy === 'publishDate') {
        aValue = a.source.publishDate || '';
        bValue = b.source.publishDate || '';
      } else if (sortBy === 'duration') {
        aValue = a.source.duration ?? 0;
        bValue = b.source.duration ?? 0;
      } else if (sortBy === 'viewCount') {
        aValue = a.source.viewCount ?? 0;
        bValue = b.source.viewCount ?? 0;
      } else if (sortBy === 'likes') {
        aValue = a.source.likes ?? 0;
        bValue = b.source.likes ?? 0;
      } else if (sortBy === 'comments') {
        aValue = a.source.comments ?? 0;
        bValue = b.source.comments ?? 0;
      } else if (sortBy === 'shares') {
        aValue = a.source.shares ?? 0;
        bValue = b.source.shares ?? 0;
      } else {
        // simpleScore
        aValue = a.simpleScore;
        bValue = b.simpleScore;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aNum = typeof aValue === 'number' ? aValue : 0;
        const bNum = typeof bValue === 'number' ? bValue : 0;
        return sortDirection === 'asc'
          ? aNum - bNum
          : bNum - aNum;
      }
    });

    return sorted;
  }, [filteredCandidates, sortBy, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sortedCandidates.map(c => c.id));
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

  const handleSort = (field: SortField) => {
    if (!onSort) return;
    
    // Toggle direction if clicking same field
    if (sortBy === field) {
      onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'desc');
    }
  };

  const allSelected = sortedCandidates.length > 0 && selectedIds.length === sortedCandidates.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < sortedCandidates.length;

  if (sortedCandidates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No candidates found.</p>
      </div>
    );
  }

  const renderSortableHeader = (field: SortField, label: string, align: 'left' | 'right' | 'center' = 'left') => {
    const isSorted = sortBy === field;
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    
    return (
      <th key={field} className={`px-4 py-3 ${alignClass}`}>
        <button
          onClick={() => handleSort(field)}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
          aria-label={`Sort by ${label}`}
        >
          {label}
          {isSorted && (
            <span className="text-xs">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      {onFilterChange && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filterRecommended}
              onChange={(e) => onFilterChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
              aria-label="Recommended only"
            />
            <span>Recommended only</span>
          </label>
        </div>
      )}

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
              {renderSortableHeader('title', 'Title')}
              {renderSortableHeader('publishDate', 'Published')}
              {renderSortableHeader('duration', 'Duration')}
              {renderSortableHeader('viewCount', 'Views', 'right')}
              {renderSortableHeader('likes', 'Likes', 'right')}
              {renderSortableHeader('comments', 'Comments', 'right')}
              {renderSortableHeader('shares', 'Shares', 'right')}
              {renderSortableHeader('simpleScore', 'Score', 'center')}
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                Recommended
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((candidate) => {
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
                  {formatNumber(candidate.source.viewCount)}
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
