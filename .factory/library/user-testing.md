# User Testing

Validation surfaces, tool choices, setup notes, and concurrency guidance.

**What belongs here:** user-facing surfaces, preferred validation tools, setup expectations, runtime gotchas, concurrency limits.
**What does NOT belong here:** implementation details not needed by validators.

---

## Validation Surface

### Browser UI

- Surface: local web app at `http://127.0.0.1:3100`
- Preferred tool: `agent-browser`
- Scope:
  - intake page
  - candidate review page
  - preparation status page
  - single video studio

### Validation Entry Paths

1. **Creator flow**
   - paste supported Douyin creator-profile link
   - confirm candidate review appears before any prep
   - select items
   - prepare selected only
   - verify mixed ready/failed behavior and retry
   - open a ready item in studio
   - edit XiaoHongShu draft and checklist

2. **Single-video flow**
   - paste supported Douyin single-video link
   - confirm candidate review is skipped
   - verify single-item prep
   - open studio once ready
   - verify draft/checklist persistence

## Validation Data Strategy

- Default validation path should use stable fixture-backed adapter outputs.
- Only switch to real `MediaCrawler` / `douyin-downloader-1` subprocess validation if the feature work has already made that adapter path reliable in this repo.
- Prepared outputs are local persisted files plus JSON workspace state; browser validation should not require live streaming from downloader subprocesses.

## Validation Concurrency

### Browser UI

- Max concurrent validators: **2**
- Planning baseline:
  - 10 logical CPUs
  - 16 GB RAM
  - existing desktop/background load already present
- Rationale:
  - lightweight Next.js app + browser automation is feasible
  - using 2 concurrent browser validators stays comfortably within the 70% headroom rule
  - higher parallelism increases timing flake risk without meaningful value for this V1 surface

## Validator Notes

- Validate behavior from the contract, not internal implementation structure.
- When checking studio persistence, always test at least one reload or revisit to distinguish saved state from in-memory client state.
- When checking prep gating, confirm non-ready items do not successfully enter studio.
## Flow Validator Guidance: agent-browser

- Use session ids prefixed with `ff79a82d9962__` and never use the default session.
- Operate only against `http://127.0.0.1:3100` for this milestone.
- Stay within the assigned assertion set; do not modify app code or global test fixtures.
- Capture required evidence listed in the validation contract in each flow report.
- Avoid cross-session interference by using independent browser sessions and not reusing form state from other validators.

### Existing Test Data for Studio Assertions

- **Creator profile session with 2 ready items**: `session_f1c753b3df009de49fb183d4`
  - Ready item 1: `item_6166501d398916df651d52ff` (title: "旅行Vlog | 周末短途游", score: 93)
  - Ready item 2: `item_719556b18b3b6d3ed7b3ce06` (title: "新品开箱｜这款相机太惊艳了！", score: 92)
  - Studio URL: `http://127.0.0.1:3100/items/item_6166501d398916df651d52ff`
  - Both have empty platform drafts and checklists (fresh for editing tests)
  - All 5 V1 platform tabs are initialized: xiaohongshu, bilibili, video-channel, wechat-oa, x
  - `otherReadyItems` response will include the other ready item for next-video navigation

### Creating New Sessions via Intake

- POST `http://127.0.0.1:3100/api/intake` with `{"link": "..."}` 
- Creator profile links: `https://www.douyin.com/user/MS4wLjABAAAA<anything>`
- Single video links: `https://www.douyin.com/video/<numeric-id>`
- Fixture adapter returns 8 deterministic candidate items for creator profiles
- Preparation (fixture mode) transitions items: pending → downloading → transcribing → ready within ~200ms
- Mixed-outcomes mode (set via `CONTENT_WORKBENCH_ADAPTER_MODE=mixed-outcomes`): URLs containing "FAIL_ME" will fail preparation

### App Route Structure

- Intake: `/` (root page)
- Candidate review: `/sessions/{sessionId}` (creator-profile sessions)
- Single-video session auto-redirects to preparation: `/sessions/{sessionId}/preparation`
- Preparation: `/sessions/{sessionId}/preparation`
- Studio: `/items/{itemId}`

### Non-ready Item Studio Gating

- GET `/api/items/{itemId}` returns 403 for non-ready items with `{ error: "Item is not ready for studio access" }`
- Studio page shows red error box with "Go Back" button for gated items

