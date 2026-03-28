/**
 * Tests for Platform Editor with draft persistence and checklist
 * 
 * Feature: studio-draft-persistence-checklists-and-next-steps
 * 
 * This test suite covers:
 * - VAL-STUDIO-005: Checklist state is tracked independently per platform
 * - VAL-STUDIO-006: Draft edits and checklist state persist across tab switches and reload
 * - VAL-STUDIO-007: Manual editing remains available when generated content is sparse
 * - VAL-STUDIO-008: Manual completion remains available even if generation quality is poor
 * - VAL-STUDIO-009: One platform tab failure does not block the others
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
    duration: 125,
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

describe('PlatformEditor - Draft Persistence', () => {
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

  it('displays save draft button', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    });
  });

  it('saves draft when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    // Edit draft fields
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    await user.type(titleInput, 'My Draft Title');

    const bodyInput = screen.getByLabelText(/Caption \/ Description/i) as HTMLTextAreaElement;
    await user.type(bodyInput, 'My draft caption');

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    // Verify POST request was made
    await waitFor(() => {
      const postCalls = mockFetch.mock.calls.filter(
        call => call[0]?.includes('/drafts') && call[1]?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThan(0);
    });

    // Verify request body contains draft data
    const lastPostCall = [...mockFetch.mock.calls]
      .reverse()
      .find(call => call[0]?.includes('/drafts') && call[1]?.method === 'POST');
    
    expect(lastPostCall).toBeDefined();
    const requestBody = JSON.parse(lastPostCall![1]!.body as string);
    expect(requestBody.platform).toBe('xiaohongshu');
    expect(requestBody.title).toBe('My Draft Title');
    expect(requestBody.body).toBe('My draft caption');
  });

  it('shows success feedback after save', async () => {
    const user = userEvent.setup();
    
    // Mock successful save
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: mockReadyItem }),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Draft saved/i)).toBeInTheDocument();
    });
  });

  it('preserves draft across tab switches', async () => {
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

    // Switch back to XiaoHongShu
    const xhsTab = screen.getByRole('button', { name: /XiaoHongShu/i });
    await user.click(xhsTab);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Verify XHS draft was preserved
    const xhsTitleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(xhsTitleInput.value).toBe('XHS Title');
  });
});

describe('PlatformEditor - Checklist State', () => {
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

  it('displays checklist section', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText(/Checklist/i)).toBeInTheDocument();
    });
  });

  it('displays platform-specific checklist items', async () => {
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByText(/Cover uploaded/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Tags added/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to publish/i)).toBeInTheDocument();
  });

  it('allows checking checklist items', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cover uploaded/i)).toBeInTheDocument();
    });

    const coverCheckbox = screen.getByLabelText(/Cover uploaded/i) as HTMLInputElement;
    expect(coverCheckbox.checked).toBe(false);

    await user.click(coverCheckbox);
    expect(coverCheckbox.checked).toBe(true);
  });

  it('saves checklist state with draft', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: mockReadyItem }),
      } as Response);
    });

    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cover uploaded/i)).toBeInTheDocument();
    });

    // Check a checklist item
    const coverCheckbox = screen.getByLabelText(/Cover uploaded/i);
    await user.click(coverCheckbox);

    // Save draft
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    // Verify checklist was saved
    await waitFor(() => {
      const lastPostCall = [...mockFetch.mock.calls]
        .reverse()
        .find(call => call[0]?.includes('/drafts') && call[1]?.method === 'POST');
      
      expect(lastPostCall).toBeDefined();
      const requestBody = JSON.parse(lastPostCall![1]!.body as string);
      expect(requestBody.checklist['cover-uploaded']).toBe(true);
    });
  });

  it('maintains independent checklist state per platform', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cover uploaded/i)).toBeInTheDocument();
    });

    // Check XiaoHongShu checklist items
    const coverCheckbox = screen.getByLabelText(/Cover uploaded/i);
    await user.click(coverCheckbox);

    // Switch to Bilibili
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Verify Bilibili checklist is independent (not checked)
    const biliCoverCheckbox = screen.getByLabelText(/Cover uploaded/i) as HTMLInputElement;
    expect(biliCoverCheckbox.checked).toBe(false);

    // Switch back to XiaoHongShu
    const xhsTab = screen.getByRole('button', { name: /XiaoHongShu/i });
    await user.click(xhsTab);

    await waitFor(() => {
      expect(screen.getByText('XiaoHongShu Draft')).toBeInTheDocument();
    });

    // Verify XHS checklist was preserved
    const xhsCoverCheckbox = screen.getByLabelText(/Cover uploaded/i) as HTMLInputElement;
    expect(xhsCoverCheckbox.checked).toBe(true);
  });

  it('loads existing checklist state from persisted data', async () => {
    const itemWithChecklist = {
      ...mockReadyItem,
      platformDrafts: {
        ...mockReadyItem.platformDrafts,
        xiaohongshu: {
          platform: 'xiaohongshu' as const,
          title: 'Existing Title',
          body: 'Existing body',
          checklist: {
            'cover-uploaded': true,
            'tags-added': true,
            'ready-to-publish': false,
          },
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: itemWithChecklist }),
    } as Response);

    render(<StudioPage />);

    await waitFor(() => {
      const coverCheckbox = screen.getByLabelText(/Cover uploaded/i) as HTMLInputElement;
      expect(coverCheckbox.checked).toBe(true);
    });

    const tagsCheckbox = screen.getByLabelText(/Tags added/i) as HTMLInputElement;
    expect(tagsCheckbox.checked).toBe(true);

    const readyCheckbox = screen.getByLabelText(/Ready to publish/i) as HTMLInputElement;
    expect(readyCheckbox.checked).toBe(false);
  });
});

describe('PlatformEditor - Sparse Content Support', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-ready-1' });
    mockUseRouter.mockReturnValue({ back: vi.fn() });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows manual editing when generated content is empty', async () => {
    const sparseItem = {
      ...mockReadyItem,
      platformDrafts: {
        ...mockReadyItem.platformDrafts,
        xiaohongshu: {
          platform: 'xiaohongshu' as const,
          title: '',
          body: '',
          checklist: {},
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: sparseItem }),
    } as Response);

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    // Verify fields are editable
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('');
    expect(titleInput).not.toBeDisabled();

    await user.type(titleInput, 'Manual Title');
    expect(titleInput.value).toBe('Manual Title');

    const bodyInput = screen.getByLabelText(/Caption \/ Description/i) as HTMLTextAreaElement;
    expect(bodyInput.value).toBe('');
    expect(bodyInput).not.toBeDisabled();

    await user.type(bodyInput, 'Manual body text');
    expect(bodyInput.value).toBe('Manual body text');
  });

  it('allows manual checklist completion with sparse content', async () => {
    const sparseItem = {
      ...mockReadyItem,
      platformDrafts: {
        ...mockReadyItem.platformDrafts,
        xiaohongshu: {
          platform: 'xiaohongshu' as const,
          title: '',
          body: '',
          checklist: {},
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ item: sparseItem }),
    } as Response);

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Cover uploaded/i)).toBeInTheDocument();
    });

    // Verify checklist items are functional
    const coverCheckbox = screen.getByLabelText(/Cover uploaded/i) as HTMLInputElement;
    expect(coverCheckbox).not.toBeDisabled();

    await user.click(coverCheckbox);
    expect(coverCheckbox.checked).toBe(true);
  });

  it('does not block save with sparse or empty content', async () => {
    const sparseItem = {
      ...mockReadyItem,
      platformDrafts: {
        ...mockReadyItem.platformDrafts,
        xiaohongshu: {
          platform: 'xiaohongshu' as const,
          title: '',
          body: '',
          checklist: {},
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: sparseItem }),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    });

    // Save button should be enabled even with empty content
    const saveButton = screen.getByRole('button', { name: /Save Draft/i }) as HTMLButtonElement;
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    // Verify save was attempted
    await waitFor(() => {
      const postCalls = mockFetch.mock.calls.filter(
        call => call[0]?.includes('/drafts') && call[1]?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThan(0);
    });
  });
});

describe('PlatformEditor - Localized Error Handling', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ itemId: 'item-ready-1' });
    mockUseRouter.mockReturnValue({ back: vi.fn() });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows error message when save fails for current platform', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Save failed' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: mockReadyItem }),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    });
  });

  it('allows switching to other platforms when one platform save fails', async () => {
    let saveAttempts = 0;
    
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        saveAttempts++;
        // First save (XiaoHongShu) fails
        if (saveAttempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Save failed' }),
          } as Response);
        }
        // Second save (Bilibili) succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: mockReadyItem }),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    // Try to save XiaoHongShu (will fail)
    await user.type(screen.getByLabelText('Title'), 'XHS Title');
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    });

    // Switch to Bilibili
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Edit and save Bilibili (should succeed)
    await user.type(screen.getByLabelText('Title'), 'Bili Title');
    const biliSaveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(biliSaveButton);

    await waitFor(() => {
      expect(screen.getByText(/Draft saved/i)).toBeInTheDocument();
    });
  });

  it('clears error message when switching platforms', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (typeof url === 'string' && url.includes('/drafts') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Save failed' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ item: mockReadyItem }),
      } as Response);
    });

    const user = userEvent.setup();
    render(<StudioPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    });

    // Trigger save error
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    });

    // Switch to Bilibili
    const bilibiliTab = screen.getByRole('button', { name: /Bilibili/i });
    await user.click(bilibiliTab);

    await waitFor(() => {
      expect(screen.getByText('Bilibili Draft')).toBeInTheDocument();
    });

    // Error should be cleared
    expect(screen.queryByText(/Failed to save draft/i)).not.toBeInTheDocument();
  });
});
