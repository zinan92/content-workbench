# Architecture

Hosted production architecture for Content Workbench.

**What belongs here:** major components, relationships, data flows, invariants.
**What does NOT belong here:** low-level implementation trivia, route-by-route code notes.

---

## High-Level System

The system is split into four responsibilities:

1. **Vercel web app** — renders the product UI, handles authenticated browser requests, enqueues durable work, and reads owner-scoped state.
2. **Supabase** — system of record for users, sessions, items, drafts, checklist state, and preparation jobs.
3. **Cloudflare R2** — stores large binary artifacts and durable prepared outputs.
4. **Railway worker** — runs long-lived preparation jobs, calls adapters/downloader/transcription logic, uploads outputs, and updates job status.

## Core Domain Objects

- **User** — authenticated owner of all hosted workbench state.
- **Workbench session** — one creator-profile or single-video workflow owned by exactly one user.
- **Content item** — one source video within a session, with review metadata, preparation state, and studio state.
- **Platform draft** — per-item, per-platform editable draft/checklist state.
- **Preparation job** — durable background work record for preparing one content item.
- **Artifact metadata** — references to hosted outputs stored in R2.

## Ownership Invariants

- Every session belongs to exactly one user.
- Every item belongs to exactly one session and therefore exactly one user.
- Every draft/checklist mutation is scoped by owner + item + platform.
- Non-owners must not be able to read or mutate another user's session, item, draft, or job state.

## Workflow Invariants

- Creator-profile flow remains: intake -> candidate review -> preparation -> studio.
- Single-video flow remains: intake -> preparation -> studio.
- Candidate review must not start preparation until the operator explicitly acts.
- Only ready items may open studio.
- One failed preparation item must not block ready siblings.

## Persistence Invariants

- Postgres is the source of truth for sessions, items, drafts, checklist state, and job state.
- R2 stores large artifacts; Postgres stores only durable metadata/keys/URLs needed by the app.
- Local filesystem state may exist temporarily during migration but must not remain the primary persistence model.

## Job Processing Model

- Web requests create or queue preparation work; they do not own durable processing.
- Railway worker consumes queued preparation jobs.
- Worker updates job state through durable transitions such as `pending -> downloading -> transcribing -> ready|failed`.
- Retries are item-scoped and idempotent.
- Repeated reads or refreshes must not duplicate items or jobs.

## Studio Model

- Studio opens only for a ready owned item.
- The left panel shows persisted source references.
- The right panel shows per-platform editable drafts.
- Draft and checklist state persist durably across reload, revisit, sign-out/sign-in, and cross-page returns for the same owner.
- Next-step affordances must remain within the operator's owned ready work.
