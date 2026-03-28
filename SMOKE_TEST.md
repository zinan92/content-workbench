# Smoke Test Checklist

This document provides a manual validation checklist for the Content Replication Workbench V1. Use this to verify the complete user journey through both creator and single-video flows.

## Prerequisites

1. Ensure the app is running:
   ```bash
   npm run dev
   ```

2. Open browser to: [http://localhost:3100](http://localhost:3100)

3. Clear any previous test data (optional):
   ```bash
   rm -rf data/workspaces/*
   ```

## Test Flow 1: Creator Profile Journey

### 1.1 Link Intake
- [ ] Navigate to the home page (`/`)
- [ ] Paste a Douyin creator profile link in the intake form
  - Example: `https://www.douyin.com/user/MS4wLjABAAAA_example`
- [ ] Click "Start" or submit the form
- [ ] Verify successful classification message appears
- [ ] Verify navigation to candidate review page (`/sessions/[sessionId]`)
- [ ] Verify NO preparation has started yet (no download/transcribe activity)

**Expected:** Intake classifies the link as "creator profile" and lands on candidate review.

### 1.2 Candidate Review
- [ ] Verify candidate table is visible with multiple rows
- [ ] Verify columns are present: Title, Publish Date, Duration, Likes, Comments, Shares, Score, Recommended flag
- [ ] Verify at least one row shows a ⭐ recommended flag
- [ ] Verify rows can be individually selected via checkboxes
- [ ] Select 2-3 candidate items using checkboxes
- [ ] Verify selection state is visible in the UI
- [ ] Sort by one column (e.g., Likes) and verify row order changes
- [ ] Verify selected items remain selected after sort
- [ ] Click "Prepare Selected" button
- [ ] Verify navigation to preparation page (`/sessions/[sessionId]`)

**Expected:** Candidate review shows discovered videos with sorting, filtering, selection, and only selected items proceed to preparation.

### 1.3 Asset Preparation
- [ ] Verify preparation page shows only the selected items
- [ ] Verify each item shows title and current status
- [ ] Watch items progress through status lifecycle:
  - `pending` → `downloading` → `transcribing` → `ready`
- [ ] Verify at least one item reaches `ready` status
- [ ] If any item shows `failed` status:
  - [ ] Verify failure reason is visible
  - [ ] Verify retry button is present
  - [ ] Verify other ready items are not blocked
- [ ] For a ready item, click "Open in Studio" or similar action
- [ ] Verify navigation to studio page (`/items/[itemId]`)

**Expected:** Preparation tracks per-item status independently, handles failures gracefully, and allows studio access only for ready items.

### 1.4 Single Video Studio
- [ ] Verify studio page loads with two-pane layout:
  - Left panel: source-of-truth reference
  - Right panel: platform workspace with tabs
- [ ] Verify left panel shows:
  - [ ] Source video preview or reference
  - [ ] Source metadata (title, stats)
  - [ ] Transcript or source context
- [ ] Verify right panel shows platform tabs:
  - [ ] XiaoHongShu (active by default)
  - [ ] Bilibili
  - [ ] Video Channel
  - [ ] WeChat Official Account
  - [ ] X
- [ ] In XiaoHongShu tab:
  - [ ] Edit the title field
  - [ ] Edit the body/caption field
  - [ ] Check/uncheck checklist items
  - [ ] Verify edits are immediately reflected in the UI
- [ ] Switch to Bilibili tab:
  - [ ] Verify XiaoHongShu edits are not visible here
  - [ ] Edit Bilibili draft fields
  - [ ] Update Bilibili checklist
- [ ] Switch back to XiaoHongShu tab:
  - [ ] Verify previous XiaoHongShu edits are still present
- [ ] Reload the page (hard refresh)
- [ ] Verify all draft edits and checklist state are restored after reload
- [ ] If "Next ready video" button is visible:
  - [ ] Click it and verify navigation to another ready item
  - [ ] Return to previous item and verify saved state is still present

**Expected:** Studio provides independent per-platform editing with persistent draft/checklist state that survives tab switches and page reloads.

---

## Test Flow 2: Single-Video Journey

### 2.1 Link Intake
- [ ] Navigate to home page (`/`)
- [ ] Paste a Douyin single-video link
  - Example: `https://www.douyin.com/video/7234567890123456789`
- [ ] Click "Start" or submit
- [ ] Verify classification message indicates "single video"
- [ ] Verify navigation directly to preparation page (skipping candidate review)
- [ ] Verify preparation page shows exactly one item

**Expected:** Single-video intake skips candidate review and goes directly to preparation.

### 2.2 Asset Preparation
- [ ] Verify single item progresses through: `pending` → `downloading` → `transcribing` → `ready`
- [ ] Click "Open in Studio" when ready
- [ ] Verify navigation to studio

**Expected:** Single-item preparation behaves the same as multi-item, just with one item.

### 2.3 Single Video Studio
- [ ] Verify studio layout is the same as in creator flow
- [ ] Edit drafts for at least two platform tabs
- [ ] Verify persistence across tab switches
- [ ] Reload the page
- [ ] Verify all edits are restored

**Expected:** Studio behaves identically regardless of whether the item came from creator or single-video flow.

---

## Test Flow 3: Error Handling

### 3.1 Invalid Intake Input
- [ ] Navigate to home page
- [ ] Submit invalid input (e.g., plain text, non-Douyin URL)
- [ ] Verify error message appears
- [ ] Verify input field preserves the typed value
- [ ] Verify page does not navigate away
- [ ] Replace with valid Douyin link and resubmit
- [ ] Verify successful flow continues

**Expected:** Invalid input shows recoverable error without losing context or requiring refresh.

### 3.2 Preparation Retry
- [ ] To simulate a failure, use the `mixed-outcomes` adapter mode:
  ```bash
  CONTENT_WORKBENCH_PREP_MODE=mixed-outcomes npm run dev
  ```
- [ ] Submit a creator profile link with `FAIL_ME` in the URL (if using test mode)
- [ ] Or wait for a naturally failing item in preparation
- [ ] Verify failed item shows:
  - [ ] `failed` status
  - [ ] Clear failure reason
  - [ ] Retry button
- [ ] Click retry
- [ ] Verify item returns to `pending` and re-attempts preparation
- [ ] Verify other ready items remain accessible during retry

**Expected:** Failed items expose clear errors and retry capability without blocking other items.

### 3.3 Non-Ready Studio Access
- [ ] Attempt to directly access studio for a non-ready item (modify URL)
  - Example: `/items/item_<id>` where the item is still `pending` or `downloading`
- [ ] Verify access is blocked with a clear message
- [ ] Verify no editable studio workspace is shown
- [ ] Navigate back to preparation page
- [ ] Verify ready items still show "Open in Studio" action

**Expected:** Studio access is gated to ready items only; non-ready access is blocked gracefully.

---

## Test Flow 4: Workflow State Persistence

### 4.1 Session Persistence Across Refresh
- [ ] Start a creator flow and select candidates
- [ ] Before clicking "Prepare Selected", reload the page
- [ ] Verify candidate selection state is restored
- [ ] Click "Prepare Selected"
- [ ] On preparation page, reload the page
- [ ] Verify preparation status is restored from persisted state
- [ ] Open a ready item in studio
- [ ] Edit multiple platform drafts
- [ ] Navigate away (back to home page)
- [ ] Navigate back to the studio page
- [ ] Verify all draft/checklist edits are restored

**Expected:** All workflow state persists across navigation and page reloads.

### 4.2 Multiple Sessions
- [ ] Complete a creator flow for one session
- [ ] Return to home page and start a new single-video session
- [ ] Verify new session is independent from the first
- [ ] Navigate back to the first session (via browser history or direct URL)
- [ ] Verify first session state is unchanged

**Expected:** Multiple sessions coexist independently with isolated persisted state.

---

## Smoke Test Summary Checklist

- [ ] **Creator flow**: Intake → Candidate Review → Preparation → Studio
- [ ] **Single-video flow**: Intake → Preparation → Studio (skips candidate review)
- [ ] **Platform isolation**: Edits in one platform tab do not affect others
- [ ] **Persistence**: Draft/checklist state survives tab switches, navigation, and page reloads
- [ ] **Error handling**: Invalid input, failed preparation, and non-ready studio access are all handled gracefully
- [ ] **Retry support**: Failed items can be retried independently
- [ ] **Multi-session**: Multiple independent sessions can coexist

---

## Notes

- This checklist reflects the **V1 local-first manual-operations scope**
- Fixture mode is the default; real downloader/crawler integration is not required for V1 smoke validation
- All persisted data lives in `data/workspaces/` and can be inspected directly if needed
- For automated validation of these flows, see the test suite and validation contract in `.factory/validation/`
