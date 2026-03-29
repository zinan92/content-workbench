---
name: worker-pipeline-worker
description: Implements durable preparation-job execution and artifact pipeline features with TDD, lifecycle verification, and explicit retry/idempotency checks.
---

# Worker Pipeline Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use for features that primarily change the durable preparation pipeline: queue/job consumption, worker execution, R2 artifact handling, retry semantics, and status updates written back to hosted persistence.

## Required Skills

- `test-driven-development` — invoke before behavior-changing worker or job-state code.
- `systematic-debugging` — invoke before fixing worker failures, retry bugs, or lifecycle inconsistencies.
- `verification-before-completion` — invoke before returning the feature as complete.

## Work Procedure

1. Read the assigned feature plus `mission.md`, `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, and `.factory/library/user-testing.md`.
2. Restate the exact preparation assertions from the feature's `fulfills` list, focusing on durable lifecycle, artifact availability, retry scope, and idempotency.
3. Invoke `test-driven-development` before implementation. Add failing tests first for job-state transitions, retry rules, worker idempotency, and artifact metadata updates.
4. Keep worker logic isolated from web request handlers. The worker should consume durable jobs and write durable outcomes.
5. Treat secrets and external integrations carefully: storage keys and service-role credentials must stay server-side only.
6. Run focused automated checks during iteration, especially on lifecycle transitions and retries.
7. When browser-visible prep behavior changes, coordinate with hosted app features or verify via targeted API reads plus browser flow evidence if the surface is already available.
8. Before completion, run the relevant validators for the touched scope and invoke `verification-before-completion`.

## Example Handoff

```json
{
  "salientSummary": "Implemented worker-backed preparation lifecycle updates and R2 artifact persistence for hosted jobs. Added failing lifecycle tests first, then verified mixed ready/failed outcomes and item-scoped retry behavior against the durable job model.",
  "whatWasImplemented": "Added worker job consumption, durable status updates, R2 artifact metadata persistence, and item-scoped retry handling so preparation rows now progress through pending/downloading/transcribing/ready/failed and expose hosted artifacts when ready.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "npx vitest run tests/workers/preparation-worker.test.ts tests/services/preparation-jobs.test.ts",
        "exitCode": 0,
        "observation": "Lifecycle, idempotency, and retry tests passed."
      },
      {
        "command": "npm run typecheck",
        "exitCode": 0,
        "observation": "No TypeScript errors in worker or job modules."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Observed a queued preparation row advance to ready and expose hosted artifact references after the worker completed the job.",
        "observed": "The preparation page restored durable ready state and artifact metadata after refresh."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "tests/workers/preparation-worker.test.ts",
        "cases": [
          {
            "name": "transitions a job through pending downloading transcribing ready",
            "verifies": "Worker-backed lifecycle states are durable and ordered."
          },
          {
            "name": "retry only re-enqueues failed items",
            "verifies": "Retry remains item-scoped and unavailable to non-failed items."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The worker feature requires platform credentials or Railway settings that are not yet available
- External downloader/transcription runtime prerequisites cannot be restored or validated
- The job model needs a mission-level architecture change rather than an implementation detail fix
- A claimed assertion cannot be completed without coordinated web-app changes in another pending feature
