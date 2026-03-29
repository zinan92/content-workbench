/**
 * Tests for Single Video Studio layout and platform tabs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioPage from '@/app/items/[itemId]/page';
import type { ContentItem } from '@/lib/domain/types';

// Create mock functions that will be controlled in tests
const mockUseParams = vi.fn();
const mockUseRouter = vi.fn();

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockReadyItem: ContentItem = {
  id: 'item-ready-1',
  sessionId: 'session-1',
  source: {
    title: 'Test Video Title',
    sourceUrl: 'https://www.douyin.com/video/test123',
    authorName: 'Test Author',
    publishDate: '2024-01-15',
    duration: 125,
    viewCount: 50000,
    likes: 5000,
    comments: 250,
    shares: 100,
  },
  simpleScore: 85,
  recommended: true,
  prepStatus: 'ready',
  artifacts: {
    videoPath: '/data/test/video.mp4',
    transcriptPath: '/data/test/transcript.json',
  },
  platformDrafts: {
    xiaohongshu: {
      platform: 'xiaohongshu',
      title: '',
      body: '',
      checklist: {},
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

describe('StudioPage - Layout', () => {
  let mockRouterBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRouterBack = vi.fn();
    mockUseParams.mockReturnValue({ itemId: 'item-ready-1' });
    mockUseRouter.mockReturnValue({ back: mockRouterBack });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ item: mockReadyItem }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders two-pane layout with left source panel and right platform workspace', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Source Reference')).toBeInTheDocument();
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Test Video Title').length).toBeGreaterThan(0);
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Source Context')).toBeInTheDocument();
  });

  it('displays video preview in left panel when available', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Video Preview')).toBeInTheDocument();
    });

    expect(screen.getByText(/video\.mp4/)).toBeInTheDocument();
  });

  it('displays source metadata including view count in left panel', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument(); // viewCount
    expect(screen.getByText('5,000')).toBeInTheDocument(); // likes
    expect(screen.getByText('250')).toBeInTheDocument(); // comments
    expect(screen.getByText('100')).toBeInTheDocument(); // shares
  });

  it('displays transcript section in left panel', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Transcript')).toBeInTheDocument();
    });

    expect(screen.getByText(/transcript\.json/)).toBeInTheDocument();
  });

  it('displays source context with score and recommended status', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Source Context')).toBeInTheDocument();
    });

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('shows placeholder when video is not available', async () => {
    const itemWithoutVideo = {
      ...mockReadyItem,
      artifacts: { transcriptPath: '/data/test/transcript.json' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: itemWithoutVideo }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('No video available')).toBeInTheDocument();
    });
  });

  it('shows placeholder when transcript is not available', async () => {
    const itemWithoutTranscript = {
      ...mockReadyItem,
      artifacts: { videoPath: '/data/test/video.mp4' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: itemWithoutTranscript }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('No transcript available')).toBeInTheDocument();
    });
  });
});

describe('StudioPage - Platform Tabs', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-ready-1' });
    mockUseRouter.mockReturnValue({ back: vi.fn() });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ item: mockReadyItem }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays all V1 platform tabs', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /XiaoHongShu/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Bilibili/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Channel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /WeChat OA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^X$/i })).toBeInTheDocument();
  });

  it('defaults to XiaoHongShu tab active', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // XHS-specific: search-keyword title field is present
    expect(screen.getByLabelText('Search-Keyword Title')).toBeInTheDocument();
  });

  it('switches to different platform tab when clicked', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
      expect(screen.getByLabelText('Repost Title')).toBeInTheDocument();
    });
  });

  it('switches to X platform tab', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    const xTab = screen.getByRole('button', { name: /^X$/i });
    await user.click(xTab);

    await waitFor(() => {
      expect(screen.getByText('X Draft')).toBeInTheDocument();
      expect(screen.getByLabelText('Post Text')).toBeInTheDocument();
    });
  });
});

describe('StudioPage - Draft Fields', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-ready-1' });
    mockUseRouter.mockReturnValue({ back: vi.fn() });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ item: mockReadyItem }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides editable search-keyword title for XiaoHongShu', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search-Keyword Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    await user.type(titleInput, 'My XHS Title');

    expect(titleInput.value).toBe('My XHS Title');
  });

  it('provides editable XHS caption field', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('XHS Caption Draft')).toBeInTheDocument();
    });

    const bodyInput = screen.getByLabelText('XHS Caption Draft') as HTMLTextAreaElement;
    await user.type(bodyInput, 'My XHS caption');

    expect(bodyInput.value).toBe('My XHS caption');
  });

  it('provides keyframe/cover candidates field for XiaoHongShu', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Keyframe \/ Cover Candidates/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/Keyframe \/ Cover Candidates/i) as HTMLTextAreaElement;
    await user.type(input, '0:15 0:42 close-up shot');

    expect(input.value).toBe('0:15 0:42 close-up shot');
  });

  it('shows Post Text label for X platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^X$/i })).toBeInTheDocument();
    });

    const xTab = screen.getByRole('button', { name: /^X$/i });
    await user.click(xTab);

    await waitFor(() => {
      expect(screen.getByLabelText('Post Text')).toBeInTheDocument();
    });
  });

  it('maintains separate draft state per platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search-Keyword Title')).toBeInTheDocument();
    });

    // Edit XHS search title
    const searchTitle = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    await user.type(searchTitle, 'XHS Search Title');

    // Switch to Bilibili
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Edit Bilibili title
    const bilibiliTitle = screen.getByLabelText('Repost Title') as HTMLInputElement;
    await user.type(bilibiliTitle, 'Bilibili Title');

    // Switch back to XHS
    const xhsTab = screen.getByRole('button', { name: /XiaoHongShu/i });
    await user.click(xhsTab);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Verify XHS draft was preserved
    const xhsSearchTitle = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
    expect(xhsSearchTitle.value).toBe('XHS Search Title');
  });

  it('loads existing platform draft data from item', async () => {
    const itemWithDrafts = {
      ...mockReadyItem,
      platformDrafts: {
        ...mockReadyItem.platformDrafts,
        xiaohongshu: {
          platform: 'xiaohongshu' as const,
          title: 'Existing Title',
          body: 'Existing body text',
          searchTitle: 'Existing Search Title',
          keyframeCandidates: '0:15 good frame',
          coverNotes: 'Existing cover notes',
          checklist: {},
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: itemWithDrafts }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      const searchTitle = screen.getByLabelText('Search-Keyword Title') as HTMLInputElement;
      expect(searchTitle.value).toBe('Existing Search Title');
    });

    const bodyInput = screen.getByLabelText('XHS Caption Draft') as HTMLTextAreaElement;
    expect(bodyInput.value).toBe('Existing body text');

    const keyframes = screen.getByLabelText(/Keyframe \/ Cover Candidates/i) as HTMLTextAreaElement;
    expect(keyframes.value).toBe('0:15 good frame');
  });
});

describe('StudioPage - Error States', () => {
  let mockRouterBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRouterBack = vi.fn();
    mockUseParams.mockReturnValue({ itemId: 'item-not-ready' });
    mockUseRouter.mockReturnValue({ back: mockRouterBack });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when item is not ready', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Item is not ready for studio access' }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Item is not ready for studio access')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  it('navigates back when error go-back button is clicked', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Item is not ready for studio access' }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Item is not ready for studio access')).toBeInTheDocument();
    });

    const goBackButton = screen.getByRole('button', { name: /Go Back/i });
    await user.click(goBackButton);

    expect(mockRouterBack).toHaveBeenCalledOnce();
  });

  it('shows error when item is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Item not found' }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load item/i)).toBeInTheDocument();
    });
  });
});
