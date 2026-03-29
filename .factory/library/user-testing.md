# User Testing

Validation surfaces, setup notes, and concurrency guidance for the hosted production architecture.

**What belongs here:** user-facing validation surfaces, required tools, setup expectations, concurrency guidance.
**What does NOT belong here:** low-level code details.

---

## Validation Surface

### Browser UI

- Primary surface: authenticated web app
- Preferred tool: `agent-browser`
- Core flows:
  - sign in / sign out
  - creator-profile intake -> candidate review -> preparation -> studio
  - single-video intake -> preparation -> studio
  - owner vs non-owner access checks
  - refresh / revisit durability checks

### API / Hosted state checks

- Secondary surface: targeted HTTP requests or browser-observed network checks for owner-scoped reads/writes, blocked mutations, and durable job state
- Use to support browser findings, not as a substitute for browser validation

## Setup Expectations

- Real Supabase auth must be configured
- At least two test accounts should exist for cross-account isolation checks
- Real R2 credentials must be configured before artifact-readiness validation
- Railway worker path must be running for durable preparation validation
- If external downloader/transcription integration remains unstable, isolate that instability behind adapter-level fallbacks without weakening ownership or durability assertions

## Validation Entry Paths

1. **Authenticated creator flow**
   - sign in
   - submit creator-profile URL
   - verify candidate review first
   - select items
   - prepare selected only
   - observe mixed success/failure behavior
   - open ready item in studio
   - verify persisted drafts/checklists

2. **Authenticated single-video flow**
   - sign in
   - submit single-video URL
   - verify candidate review is skipped
   - verify one durable preparation row
   - open studio after readiness

3. **Ownership/isolation flow**
   - use separate browser contexts for owner and non-owner
   - verify blocked reads and blocked writes
   - verify no draft/session leakage across accounts

## Validation Concurrency

### Browser UI

- Max concurrent validators: **2**
- Rationale:
  - auth/isolation checks naturally require multiple browser contexts
  - browser automation remains lightweight locally, but hosted state setup and worker-driven lifecycle checks make validation more stateful than the original local-first mission
  - limiting to 2 concurrent validators reduces flake risk while still allowing owner/non-owner paired validation

## Validator Notes

- Validate against real hosted ownership and persistence, not local filesystem behavior.
- For any persistence assertion, include at least one reload or revisit check.
- For any ownership assertion, prove both owner success and non-owner blocked behavior.
- For preparation assertions, confirm the worker-backed lifecycle is durable rather than tied to a single request.
