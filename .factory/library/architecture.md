# Architecture

High-level system shape for Content Replication Workbench V1.

**What belongs here:** major components, relationships, data flow, invariants, adapter boundaries.
**What does NOT belong here:** line-by-line implementation details.

---

## System Shape

The product is a thin standalone Next.js workbench with four operator-facing surfaces:

1. **Link Intake**
2. **Candidate Review**
3. **Asset Preparation Status**
4. **Single Video Studio**

The app is local-first and single-operator. Its core responsibility is coordinating browser workflow and persisted workspace state, not running distributed jobs or acting as an automation platform.

## Core Layers

### UI / Route Layer

- `app/` pages and route handlers
- Thin request/response layer only
- Reads and writes session/item state through services

### Domain Layer

- `lib/domain/*`
- Pure logic:
  - Douyin link classification
  - deterministic scoring/recommendation
  - content item / session / draft schemas
  - status enums and state-shaping helpers

### Service Layer

- `lib/services/*`
- Orchestrates domain logic + persistence + adapters
- Owns session creation, candidate hydration, preparation lifecycle state changes, and platform-draft persistence

### Adapter Layer

- `lib/adapters/*`
- Encapsulates unstable external capability repos
- Expected adapters:
  - discovery adapter around `MediaCrawler`
  - preparation adapter around `douyin-downloader-1`
- Default V1 mode may be fixture-backed, but the adapter contract must stay stable so real subprocess integration can replace fixtures later without redesign

### Persistence Layer

- Repo-local JSON under `data/workspaces/`
- Source of truth for:
  - sessions
  - discovered candidate items
  - selected item ids
  - prep status and artifact paths
  - per-platform draft/checklist state

## Primary Data Model

### Session

A session begins at intake and tracks:

- input link + classified input type
- candidate rows for creator flow
- selected item ids
- current workflow phase
- related content-item ids

### Content Item

Each discovered/prepared video has a stable record including:

- source metadata and engagement metrics
- simple score + recommended flag
- prep status
- persisted artifact paths
- per-platform drafts/checklists

The canonical preparation status values are:

- `pending`
- `downloading`
- `transcribing`
- `ready`
- `failed`

Allowed transitions are intentionally simple:

- `pending -> downloading`
- `downloading -> transcribing`
- `downloading -> ready` (if no transcription step is required)
- `transcribing -> ready`
- `downloading|transcribing -> failed`
- `failed -> pending` (retry path)

Studio access is allowed only from `ready`.

### Platform Drafts

Per-platform editable state is stored independently for:

- XiaoHongShu
- Bilibili
- Video Channel
- WeChat Official Account
- X

Each platform draft owns its own editable fields and checklist state. One platform tab must not overwrite another.

## Canonical User Flows

### Creator Flow

`intake -> classify creator link -> discover metadata -> candidate review -> manual selection -> prepare selected only -> ready item -> studio`

Creator discovery may be partial. Partial discovery is still a valid review state as long as the operator sees the rows that were fetched plus a clear partial-results message.

### Single-Video Flow

`intake -> classify single-video link -> create one-item session -> prepare item -> ready item -> studio`

## Key Invariants

- **Discover first, prepare later** for creator-profile input
- **Single-video input skips candidate review**
- **Only selected creator items are prepared**
- **Preparation is item-isolated**: one item failure must not block others
- **Studio is ready-item-only** and non-ready/direct invalid access resolves to a recoverable blocked state
- **Platform tabs are isolated**: one platform tab failure must not block others
- **Manual editing and manual completion are always available**
- **Persisted local state survives refresh/navigation**

## External Capability Boundaries

### Discovery

- Reuses `MediaCrawler` capabilities through an adapter boundary
- Output needed by the app is lightweight candidate metadata, not media downloads

### Preparation

- Reuses `douyin-downloader-1` through an adapter boundary
- Preparation writes local outputs to disk
- The workbench reads those saved outputs and surfaces their state in the browser

Expected canonical artifact fields on a prepared item:

- `videoPath`
- `transcriptPath`
- `archivePath`
- `analysisPath`
- optional cover/thumbnail or auxiliary media notes

The adapter may source those from fixtures or real local subprocess output, but the item record exposed to the app should normalize them into a stable item-level artifact contract.

## Studio Navigation Helpers

When applicable, the studio may expose lightweight next-step affordances:

- `Next platform`
- `Next ready video`

These are navigation helpers inside the studio workspace, not a separate orchestration system.

## Non-Goals Encoded In The Architecture

- No database
- No queue/worker system
- No orchestration dashboard
- No automatic publishing
- No AI dependency for recommendation logic

The architecture should remain thin enough that future AI augmentation or stronger subprocess integration can be added as new adapters/services rather than by restructuring the whole app.
