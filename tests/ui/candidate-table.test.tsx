/**
 * Tests for CandidateTable component interactions
 * 
 * Coverage:
 * - Sorting by metric/field
 * - Recommendation filtering
 * - Selection controls (individual + select-all)
 * - Selection persistence through sort/filter
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateTable from '../../components/CandidateTable';
import type { ContentItem } from '../../lib/domain/types';

/**
 * Create test candidate fixture
 */
function createCandidate(overrides?: Partial<ContentItem>): ContentItem {
  const now = new Date().toISOString();
  const id = `item-${Math.random().toString(36).substring(7)}`;
  
  return {
    id,
    sessionId: 'test-session',
    source: {
      title: 'Test Video',
      publishDate: now,
      duration: 60,
      likes: 100,
      comments: 10,
      shares: 5,
      sourceUrl: 'https://www.douyin.com/video/test',
      authorName: 'Test Author',
    },
    simpleScore: 50,
    recommended: false,
    prepStatus: 'pending',
    platformDrafts: {} as ContentItem['platformDrafts'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('CandidateTable - Sorting', () => {
  it('should sort candidates by likes descending', async () => {
    const user = userEvent.setup();
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', likes: 100, sourceUrl: 'url' } }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', likes: 500, sourceUrl: 'url' } }),
      createCandidate({ id: 'item-3', source: { title: 'Video C', likes: 200, sourceUrl: 'url' } }),
    ];

    const onSort = vi.fn();
    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        sortBy="title"
        sortDirection="desc"
        onSort={onSort}
      />
    );

    // Click likes column header to trigger sort (switching from title to likes)
    const likesHeader = screen.getByRole('button', { name: /sort by likes/i });
    await user.click(likesHeader);

    expect(onSort).toHaveBeenCalledWith('likes', 'desc');
  });

  it('should toggle sort direction when clicking same column', async () => {
    const user = userEvent.setup();
    const candidates = [createCandidate()];
    const onSort = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        sortBy="likes"
        sortDirection="desc"
        onSort={onSort}
      />
    );

    const likesHeader = screen.getByRole('button', { name: /sort by likes/i });
    await user.click(likesHeader);

    // Should toggle to ascending
    expect(onSort).toHaveBeenCalledWith('likes', 'asc');
  });

  it('should display candidates in sorted order', () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', likes: 500, sourceUrl: 'url' } }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', likes: 200, sourceUrl: 'url' } }),
      createCandidate({ id: 'item-3', source: { title: 'Video C', likes: 100, sourceUrl: 'url' } }),
    ];

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        sortBy="likes"
        sortDirection="desc"
      />
    );

    const rows = screen.getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    
    // Verify order: 500, 200, 100 (descending)
    expect(within(dataRows[0]).queryByText('Video A')).toBeTruthy();
    expect(within(dataRows[1]).queryByText('Video B')).toBeTruthy();
    expect(within(dataRows[2]).queryByText('Video C')).toBeTruthy();
  });

  it('should sort by simple score', async () => {
    const user = userEvent.setup();
    const candidates = [
      createCandidate({ id: 'item-1', simpleScore: 30 }),
      createCandidate({ id: 'item-2', simpleScore: 80 }),
      createCandidate({ id: 'item-3', simpleScore: 50 }),
    ];

    const onSort = vi.fn();
    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onSort={onSort}
      />
    );

    const scoreHeader = screen.getByRole('button', { name: /sort by score/i });
    await user.click(scoreHeader);

    expect(onSort).toHaveBeenCalledWith('simpleScore', 'desc');
  });
});

describe('CandidateTable - Filtering', () => {
  it('should show only recommended candidates when filter is active', () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', sourceUrl: 'url' }, recommended: true }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', sourceUrl: 'url' }, recommended: false }),
      createCandidate({ id: 'item-3', source: { title: 'Video C', sourceUrl: 'url' }, recommended: true }),
    ];

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        filterRecommended={true}
      />
    );

    // Should only show recommended items
    expect(screen.queryByText('Video A')).toBeTruthy();
    expect(screen.queryByText('Video B')).toBeFalsy();
    expect(screen.queryByText('Video C')).toBeTruthy();
  });

  it('should show all candidates when filter is inactive', () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', sourceUrl: 'url' }, recommended: true }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', sourceUrl: 'url' }, recommended: false }),
    ];

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        filterRecommended={false}
      />
    );

    expect(screen.queryByText('Video A')).toBeTruthy();
    expect(screen.queryByText('Video B')).toBeTruthy();
  });

  it('should call onFilterChange when filter control is toggled', async () => {
    const user = userEvent.setup();
    const candidates = [createCandidate()];
    const onFilterChange = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        filterRecommended={false}
        onFilterChange={onFilterChange}
      />
    );

    const filterControl = screen.getByRole('checkbox', { name: /recommended only/i });
    await user.click(filterControl);

    expect(onFilterChange).toHaveBeenCalledWith(true);
  });
});

describe('CandidateTable - Selection', () => {
  it('should select individual candidate on checkbox click', async () => {
    const user = userEvent.setup();
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', sourceUrl: 'url' } }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', sourceUrl: 'url' } }),
    ];
    const onSelectionChange = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    const checkbox = screen.getByLabelText('Select Video A');
    await user.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith(['item-1']);
  });

  it('should deselect candidate when clicking selected checkbox', async () => {
    const user = userEvent.setup();
    const candidates = [createCandidate({ id: 'item-1', source: { title: 'Video A', sourceUrl: 'url' } })];
    const onSelectionChange = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1']}
        onSelectionChange={onSelectionChange}
      />
    );

    const checkbox = screen.getByLabelText('Select Video A');
    await user.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('should select all candidates when select-all is clicked', async () => {
    const user = userEvent.setup();
    const candidates = [
      createCandidate({ id: 'item-1' }),
      createCandidate({ id: 'item-2' }),
      createCandidate({ id: 'item-3' }),
    ];
    const onSelectionChange = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all candidates');
    await user.click(selectAllCheckbox);

    expect(onSelectionChange).toHaveBeenCalledWith(['item-1', 'item-2', 'item-3']);
  });

  it('should deselect all candidates when clicking select-all with all selected', async () => {
    const user = userEvent.setup();
    const candidates = [
      createCandidate({ id: 'item-1' }),
      createCandidate({ id: 'item-2' }),
    ];
    const onSelectionChange = vi.fn();

    render(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1', 'item-2']}
        onSelectionChange={onSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all candidates');
    await user.click(selectAllCheckbox);

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });
});

describe('CandidateTable - Selection Persistence Through Interactions', () => {
  it('should maintain selection after sorting', async () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', likes: 100, sourceUrl: 'url' } }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', likes: 500, sourceUrl: 'url' } }),
    ];
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1']}
        onSelectionChange={onSelectionChange}
        sortBy="likes"
        sortDirection="asc"
      />
    );

    // Verify item-1 is selected
    const checkbox1 = screen.getByLabelText('Select Video A') as HTMLInputElement;
    expect(checkbox1.checked).toBe(true);

    // Change sort direction
    rerender(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1']}
        onSelectionChange={onSelectionChange}
        sortBy="likes"
        sortDirection="desc"
      />
    );

    // Verify item-1 is still selected after sort
    const checkbox1AfterSort = screen.getByLabelText('Select Video A') as HTMLInputElement;
    expect(checkbox1AfterSort.checked).toBe(true);
  });

  it('should maintain selection after filtering', () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'Video A', sourceUrl: 'url' }, recommended: true }),
      createCandidate({ id: 'item-2', source: { title: 'Video B', sourceUrl: 'url' }, recommended: false }),
    ];

    const { rerender } = render(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1', 'item-2']}
        onSelectionChange={vi.fn()}
        filterRecommended={false}
      />
    );

    // Both items selected
    const checkboxA = screen.getByLabelText('Select Video A') as HTMLInputElement;
    const checkboxB = screen.getByLabelText('Select Video B') as HTMLInputElement;
    expect(checkboxA.checked).toBe(true);
    expect(checkboxB.checked).toBe(true);

    // Apply recommended filter
    rerender(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-1', 'item-2']}
        onSelectionChange={vi.fn()}
        filterRecommended={true}
      />
    );

    // Item-1 still selected, item-2 filtered out but selection preserved
    const checkboxAFiltered = screen.getByLabelText('Select Video A') as HTMLInputElement;
    expect(checkboxAFiltered.checked).toBe(true);
    expect(screen.queryByText('Video B')).toBeFalsy();
  });

  it('should preserve selection when items re-order and filter changes', () => {
    const candidates = [
      createCandidate({ id: 'item-1', source: { title: 'A', likes: 100, sourceUrl: 'url' }, recommended: true }),
      createCandidate({ id: 'item-2', source: { title: 'B', likes: 500, sourceUrl: 'url' }, recommended: true }),
      createCandidate({ id: 'item-3', source: { title: 'C', likes: 300, sourceUrl: 'url' }, recommended: false }),
    ];

    const { rerender } = render(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-2', 'item-3']}
        onSelectionChange={vi.fn()}
        sortBy="likes"
        sortDirection="desc"
        filterRecommended={false}
      />
    );

    // Verify initial selection
    const checkboxB = screen.getByLabelText('Select B') as HTMLInputElement;
    const checkboxC = screen.getByLabelText('Select C') as HTMLInputElement;
    expect(checkboxB.checked).toBe(true);
    expect(checkboxC.checked).toBe(true);

    // Change sort and filter
    rerender(
      <CandidateTable
        candidates={candidates}
        selectedIds={['item-2', 'item-3']}
        onSelectionChange={vi.fn()}
        sortBy="simpleScore"
        sortDirection="asc"
        filterRecommended={true}
      />
    );

    // item-2 still selected and visible, item-3 filtered out
    const checkboxBFiltered = screen.getByLabelText('Select B') as HTMLInputElement;
    expect(checkboxBFiltered.checked).toBe(true);
    expect(screen.queryByText('C')).toBeFalsy();
  });
});
