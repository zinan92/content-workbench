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
