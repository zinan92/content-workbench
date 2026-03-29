# Content Replication Workbench

A local-first web application for manual content replication from Douyin to multiple platforms.

## Purpose

This standalone tool helps content operators replicate Douyin videos to XiaoHongShu, Bilibili, WeChat Video Channel, WeChat Official Account, and X. It emphasizes **manual operations first** with a clean workflow that keeps discovery and preparation separate.

## V1 Scope

**Local-first, manual-operations-focused V1:**

1. **Link Intake** — Accept Douyin creator profile or single video links
2. **Candidate Discovery & Review** — Browse discovered videos, see transparent recommendation scores, select items for preparation
3. **Asset Preparation Status** — Track download/transcription progress, handle isolated per-item failures, retry when needed
4. **Single Video Studio** — Manual editing workspace with source-of-truth reference panel plus per-platform draft fields and checklists

**Target Platforms (V1) with minimum outputs:**
- **XiaoHongShu** (primary, default tab) — search-keyword title, XHS caption draft, cover/keyframe candidate
- **Bilibili** — repost-ready title and description
- **WeChat Video Channel** — repost-ready title and description
- **WeChat Official Account** — article title and text draft
- **X** — short-form post draft

**Key V1 Boundaries:**
- ✅ Repo-local JSON persistence (no database)
- ✅ Local-first — no hosted auth required (works without Supabase)
- ✅ Manual selection and editing at every stage
- ✅ Isolated per-item and per-platform failure handling
- ✅ Candidate table includes view/play count as a metric
- ❌ No automatic posting/publishing
- ❌ No AI-generated recommendations (simple transparent scoring only)
- ❌ No live external queues or worker daemons
- ❌ No hosted auth/Supabase/R2/Railway required for V1

## Tech Stack

- **Next.js 16** with App Router
- **React 19** + TypeScript
- **Tailwind CSS** for styling
- **Vitest** for testing
- **Node 22 LTS** (pinned via `.nvmrc`)

## Getting Started

### Prerequisites

- Node.js 22 LTS (use `nvm use` if you have nvm installed)
- The repo includes `.nvmrc` and `.node-version` files to pin the runtime

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will start on [http://localhost:3100](http://localhost:3100).

By default, the app runs in **fixture mode** for stable development without external dependencies. See [Adapter Modes](#adapter-modes) below for configuration options.

### Available Scripts

- `npm run dev` — Start development server on port 3100
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checking
- `npm test` — Run Vitest tests (use `npm test -- --run` for CI mode)

## Project Structure

```
content-workbench/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
├── lib/
│   ├── domain/      # Core business logic and types
│   ├── services/    # Application services
│   └── adapters/    # External capability boundaries
├── data/
│   └── workspaces/  # Repo-local JSON session/workspace state
├── tests/           # Vitest tests
└── .factory/        # Mission infrastructure
```

## Persistence Model

V1 uses **repo-local JSON files** under `data/workspaces/` for session, item, and platform-draft state. No database, no external queue. Prepared media artifacts are saved to stable local paths and referenced by the workspace store.

### Runtime Data Location

- **Session/workspace state**: `data/workspaces/<sessionId>/session.json`
- **Content items**: `data/workspaces/<sessionId>/items/<itemId>.json`
- **Prepared artifacts** (in fixture mode): Referenced as `/data/artifacts/<itemId>/<file>` in item metadata

All workspace data persists across app restarts and page refreshes.

## Adapter Modes

The app uses two adapters with configurable modes:

### Discovery Adapter (MediaCrawler boundary)

Handles Douyin creator profile discovery and single-video resolution.

**Configuration:**

```bash
# Use either the combined mode or specific discovery mode
CONTENT_WORKBENCH_ADAPTER_MODE=fixtures          # Default (stable)
CONTENT_WORKBENCH_DISCOVERY_MODE=fixtures        # Override combined mode
# CONTENT_WORKBENCH_DISCOVERY_MODE=mediacrawler  # Not yet implemented
```

**Available modes:**
- `fixtures` (default) — Deterministic fixture data for stable development/testing
- `partial` — Simulates partial discovery results for testing error handling
- `fail-on-resolution` — Simulates resolution failures for testing error paths

### Preparation Adapter (douyin-downloader-1 boundary)

Handles video download and transcription.

**Configuration:**

```bash
# Use either the combined mode or specific prep mode
CONTENT_WORKBENCH_ADAPTER_MODE=fixtures          # Default (stable)
CONTENT_WORKBENCH_PREP_MODE=fixtures             # Override combined mode
# CONTENT_WORKBENCH_PREP_MODE=douyin-downloader  # Not yet implemented
```

**Available modes:**
- `fixtures` (default) — Deterministic fixture artifacts for stable development/testing
- `mixed-outcomes` — Simulates both successful and failed preparations for testing retry logic

### Why Fixture Mode?

Fixture mode is the **default and recommended** mode for V1 because:

1. **Stable validation** — No dependency on external crawler/downloader state, cookies, or login sessions
2. **Fast iteration** — No waiting for real downloads or network requests
3. **Deterministic testing** — Reproducible results across development and CI
4. **Clean contracts** — Real adapter integration can be added later without changing the service layer

Real `MediaCrawler` and `douyin-downloader-1` integration may be added in future versions once those adapter paths are proven stable.

## External Capability References

The following external repositories may be integrated via adapter boundaries in the future:

- **MediaCrawler** — `/Users/wendy/work/content-co/MediaCrawler` (Douyin creator discovery)
- **douyin-downloader-1** — `/Users/wendy/work/content-co/douyin-downloader-1` (Video download and transcription)

These repos are **reference only** for V1. The app does not modify them.

## Development Workflow

1. Create failing tests for new behavior (TDD)
2. Implement the feature with thin route handlers and focused domain logic
3. Run typecheck and tests
4. Verify browser flow with manual or agent-browser checks
5. Commit logical changes with clear messages

## Validation

### Automated Tests

Run the full test suite:

```bash
npm run test -- --run
```

Run specific test files:

```bash
npm test -- tests/domain/links.test.ts
```

Run with watch mode during development:

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Build Validation

Verify the production build succeeds:

```bash
npm run build
```

### Smoke Testing (Manual Browser Validation)

See [SMOKE_TEST.md](./SMOKE_TEST.md) for the complete manual validation checklist covering:

- Creator profile intake → candidate review → preparation → studio
- Single-video intake → preparation → studio
- Per-platform draft/checklist persistence
- Error handling and retry flows

## Testing

```bash
npm test                    # Run all tests
npm test -- --watch         # Run in watch mode
npm test -- path/to/test    # Run specific test file
```

## Contributing

This is mission-driven development. Features are implemented in logical milestones:

1. **Scaffold** — Foundation, persistence, and app structure
2. **Intake + Discovery** — Link classification and candidate review
3. **Preparation** — Asset download/transcription status tracking
4. **Studio** — Manual editing workspace with per-platform tabs

Refer to `.factory/` for mission context and boundaries.

## License

Private — internal tool for content operations.
