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

    // Verify left panel content
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

  it('displays source metadata in left panel', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    expect(screen.getByText('2:05')).toBeInTheDocument(); // 125 seconds = 2:05
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

    expect(screen.getByText('85')).toBeInTheDocument(); // score
    expect(screen.getByText('Yes')).toBeInTheDocument(); // recommended
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

    expect(screen.getByText('Little Red Book')).toBeInTheDocument();
  });

  it('switches to different platform tab when clicked', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Click Bilibili tab
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
      expect(screen.getByText('Video platform')).toBeInTheDocument();
    });
  });

  it('switches to X platform tab', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Click X tab
    const xTab = screen.getByRole('button', { name: /^X$/i });
    await user.click(xTab);

    await waitFor(() => {
      expect(screen.getByText('X Draft')).toBeInTheDocument();
      expect(screen.getByText('Twitter/X')).toBeInTheDocument();
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

  it('provides editable title field', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    await user.type(titleInput, 'My Draft Title');

    expect(titleInput.value).toBe('My Draft Title');
  });

  it('provides editable body/caption field', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Caption \/ Description/i)).toBeInTheDocument();
    });

    const bodyInput = screen.getByLabelText(/Caption \/ Description/i) as HTMLTextAreaElement;
    await user.type(bodyInput, 'My draft caption text');

    expect(bodyInput.value).toBe('My draft caption text');
  });

  it('provides editable cover/visual notes field', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cover \/ Visual Notes/i)).toBeInTheDocument();
    });

    const coverInput = screen.getByLabelText(/Cover \/ Visual Notes/i) as HTMLTextAreaElement;
    await user.type(coverInput, 'Cover image notes');

    expect(coverInput.value).toBe('Cover image notes');
  });

  it('shows Tweet Text label for X platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^X$/i })).toBeInTheDocument();
    });

    // Switch to X tab
    const xTab = screen.getByRole('button', { name: /^X$/i });
    await user.click(xTab);

    await waitFor(() => {
      expect(screen.getByLabelText('Tweet Text')).toBeInTheDocument();
    });
  });

  it('maintains separate draft state per platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    // Edit XiaoHongShu draft
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    await user.type(titleInput, 'XHS Title');

    // Switch to Bilibili
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Edit Bilibili draft
    const bilibiliTitleInput = screen.getByLabelText('Title') as HTMLInputElement;
    await user.type(bilibiliTitleInput, 'Bilibili Title');

    // Switch back to XiaoHongShu
    const xhsTab = screen.getByRole('button', { name: /XiaoHongShu/i });
    await user.click(xhsTab);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Verify XiaoHongShu draft was preserved
    const xhsTitleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(xhsTitleInput.value).toBe('XHS Title');
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
      const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
      expect(titleInput.value).toBe('Existing Title');
    });

    const bodyInput = screen.getByLabelText(/Caption \/ Description/i) as HTMLTextAreaElement;
    expect(bodyInput.value).toBe('Existing body text');

    const coverInput = screen.getByLabelText(/Cover \/ Visual Notes/i) as HTMLTextAreaElement;
    expect(coverInput.value).toBe('Existing cover notes');
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
