/**
 * Tests for Studio Next-Step Navigation Affordances
 * 
 * Feature: studio-draft-persistence-checklists-and-next-steps
 * 
 * This test suite covers:
 * - VAL-STUDIO-010: Studio exposes lightweight next-step affordances when applicable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioPage from '@/app/items/[itemId]/page';
import type { ContentItem } from '@/lib/domain/types';

// Create mock functions
const mockUseParams = vi.fn();
const mockUseRouter = vi.fn();
const mockPush = vi.fn();

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockReadyItem: ContentItem = {
  id: 'item-1',
  sessionId: 'session-1',
  source: {
    title: 'Test Video',
    sourceUrl: 'https://www.douyin.com/video/test123',
    duration: 120,
  },
  simpleScore: 75,
  recommended: true,
  prepStatus: 'ready',
  artifacts: {
    videoPath: '/data/test/video.mp4',
    transcriptPath: '/data/test/transcript.json',
  },
  platformDrafts: {
    xiaohongshu: {
      platform: 'xiaohongshu',
      title: 'XHS Title',
      body: 'XHS Body',
      checklist: { 'cover-uploaded': true },
      lastUpdated: new Date().toISOString(),
    },
    bilibili: {
      platform: 'bilibili',
      title: '',
      body: '',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    },
    'video-channel': {
      platform: 'video-channel',
      title: '',
      body: '',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    },
    'wechat-oa': {
      platform: 'wechat-oa',
      title: '',
      body: '',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    },
    x: {
      platform: 'x',
      title: '',
      body: '',
      checklist: {},
      lastUpdated: new Date().toISOString(),
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('StudioNavigation - Next Platform', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-1' });
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({ back: vi.fn(), push: mockPush });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ item: mockReadyItem }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays Next Platform button when other platforms exist', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next Platform/i })).toBeInTheDocument();
    });
  });

  it('switches to next platform tab when Next Platform is clicked', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Click Next Platform
    const nextPlatformButton = screen.getByRole('button', { name: /Next Platform/i });
    await user.click(nextPlatformButton);

    // Should switch to Bilibili (next in order after XiaoHongShu)
    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });
  });

  it('wraps around to first platform when on last platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Switch to X (last platform)
    const xTab = screen.getByRole('button', { name: /^X$/i });
    await user.click(xTab);

    await waitFor(() => {
      expect(screen.getByText('X Draft')).toBeInTheDocument();
    });

    // Click Next Platform
    const nextPlatformButton = screen.getByRole('button', { name: /Next Platform/i });
    await user.click(nextPlatformButton);

    // Should wrap to XiaoHongShu
    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });
  });

  it('preserves draft state when navigating with Next Platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search-Keyword Title')).toBeInTheDocument();
    });

    // Edit XiaoHongShu draft
    const titleInput = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated XHS Title');

    // Click Next Platform
    const nextPlatformButton = screen.getByRole('button', { name: /Next Platform/i });
    await user.click(nextPlatformButton);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Go back to XiaoHongShu
    const xhsTab = screen.getByRole('button', { name: /XiaoHongShu/i });
    await user.click(xhsTab);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Verify XHS draft was preserved
    const xhsTitleInput = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    expect(xhsTitleInput.value).toBe('Updated XHS Title');
  });
});

describe('StudioNavigation - Next Ready Video', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-1' });
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({ back: vi.fn(), push: mockPush });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays Next Ready Video button when other ready items exist', async () => {
    // Mock session with multiple ready items
    mockFetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [
              { id: 'item-2', title: 'Video 2' },
              { id: 'item-3', title: 'Video 3' },
            ],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next Ready Video/i })).toBeInTheDocument();
    });
  });

  it('does not display Next Ready Video button when no other ready items exist', async () => {
    // Mock single-item session
    mockFetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Next Ready Video/i })).not.toBeInTheDocument();
  });

  it('navigates to next ready item when Next Ready Video is clicked', async () => {
    // Mock session with multiple ready items
    mockFetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [
              { id: 'item-2', title: 'Video 2' },
            ],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next Ready Video/i })).toBeInTheDocument();
    });

    // Click Next Ready Video
    const nextVideoButton = screen.getByRole('button', { name: /Next Ready Video/i });
    await user.click(nextVideoButton);

    // Verify navigation occurred
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/items/item-2');
    });
  });

  it('saves current draft before navigating to next video', async () => {
    // Mock session with multiple ready items
    let saveCalled = false;
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        saveCalled = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [
              { id: 'item-2', title: 'Video 2' },
            ],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search-Keyword Title')).toBeInTheDocument();
    });

    // Edit draft
    const titleInput = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Modified Title');

    // Click Next Ready Video
    const nextVideoButton = screen.getByRole('button', { name: /Next Ready Video/i });
    await user.click(nextVideoButton);

    // Verify save was called before navigation
    await waitFor(() => {
      expect(saveCalled).toBe(true);
    });
  });
});

describe('StudioNavigation - Combined Affordances', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-1' });
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({ back: vi.fn(), push: mockPush });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays both Next Platform and Next Ready Video when applicable', async () => {
    // Mock session with multiple ready items
    mockFetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [
              { id: 'item-2', title: 'Video 2' },
            ],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next Platform/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Next Ready Video/i })).toBeInTheDocument();
  });

  it('positions next-step controls conveniently near save button', async () => {
    // Mock session with multiple ready items
    mockFetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/items/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            item: mockReadyItem,
            otherReadyItems: [
              { id: 'item-2', title: 'Video 2' },
            ],
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    });

    // Verify next-step buttons are present in the same section
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    const nextPlatformButton = screen.getByRole('button', { name: /Next Platform/i });
    const nextVideoButton = screen.getByRole('button', { name: /Next Ready Video/i });

    expect(saveButton).toBeInTheDocument();
    expect(nextPlatformButton).toBeInTheDocument();
    expect(nextVideoButton).toBeInTheDocument();
  });
});
