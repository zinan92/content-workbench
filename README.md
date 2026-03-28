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

**Target Platforms (V1):**
- XiaoHongShu (primary, default tab)
- Bilibili
- WeChat Video Channel
- WeChat Official Account
- X

**Key V1 Boundaries:**
- ✅ Repo-local JSON persistence (no database)
- ✅ Manual selection and editing at every stage
- ✅ Isolated per-item and per-platform failure handling
- ❌ No automatic posting/publishing
- ❌ No AI-generated recommendations (simple transparent scoring only)
- ❌ No live external queues or worker daemons

## Tech Stack

- **Next.js 16** with App Router
- **React 19** + TypeScript
- **Tailwind CSS** for styling
- **Vitest** for testing
- **Node 22 LTS** (pinned via `.nvmrc`)

## Getting Started

### Prerequisites

- Node.js 22 LTS (use `nvm use` if you have nvm installed)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on [http://localhost:3100](http://localhost:3100).

### Available Scripts

- `npm run dev` — Start development server on port 3100
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checking
- `npm test` — Run Vitest tests

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

## External Capabilities (Reference Only)

This repo does not modify the following external repositories but may integrate with them via clean adapter boundaries:

- **MediaCrawler** — Douyin creator discovery
- **douyin-downloader-1** — Video download and transcription

Default V1 validation uses stable local fixtures when live integration is brittle.

## Development Workflow

1. Create failing tests for new behavior (TDD)
2. Implement the feature with thin route handlers and focused domain logic
3. Run typecheck and tests
4. Verify browser flow with manual or agent-browser checks
5. Commit logical changes with clear messages

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
