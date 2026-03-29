---
name: hosted-app-worker
description: Implements hosted web-app features for the production architecture upgrade with TDD, browser verification, and ownership-aware validation.
---

# Hosted App Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use for features that primarily change the Next.js web app, hosted repository layer, auth/session ownership logic, browser-visible workflow behavior, deployment config, and documentation/runbook updates.

## Required Skills

- `test-driven-development` — invoke before code changes that affect behavior.
- `agent-browser` — invoke for browser-visible flows, especially auth, ownership, and persistence checks.
- `systematic-debugging` — invoke before fixing broken hosted flows, failing tests, or unexpected auth/storage behavior.
- `verification-before-completion` — invoke before returning the feature as complete.

## Work Procedure

1. Read the assigned feature plus `mission.md`, `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, and `.factory/library/user-testing.md`.
2. Restate the user-visible assertions from the feature's `fulfills` list and identify the exact hosted surfaces that must become testable.
3. Invoke `test-driven-development` before implementation. Add failing tests first for repository logic, route handlers, auth ownership rules, or UI behavior.
4. Keep route handlers thin. Centralize hosted data access through explicit repository/service modules rather than raw inline client calls.
5. Preserve browser-safe vs server-only credential boundaries. Never expose service-role or storage secrets to the client.
6. During iteration, run focused automated checks for the touched scope.
7. Use `agent-browser` for every browser-visible behavior change. For hosted persistence or ownership work, include reload/revisit and owner vs non-owner checks whenever applicable.
8. Before completion, run the relevant validators for the touched scope; for milestone-finishing work, expand to broader validation.
9. Invoke `verification-before-completion`, then prepare a concrete handoff.

## Example Handoff

```json
{
  "salientSummary": "Implemented Supabase-backed protected routing and owner-scoped session reads for hosted candidate review. Added failing auth/repository tests first, then verified owner success and non-owner blocking in separate browser sessions.",
  "whatWasImplemented": "Added hosted auth guards for protected pages, moved session reads behind an owner-scoped repository, and updated candidate-review loading so only the owning user can reopen a session. Non-owner deep links now return a blocked state without leaking candidate data.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "npx vitest run tests/api/session-auth.test.ts tests/repositories/session-repository.test.ts",
        "exitCode": 0,
        "observation": "Owner-scoped session tests and protected-route tests passed."
      },
      {
        "command": "npm run typecheck",
        "exitCode": 0,
        "observation": "No TypeScript errors in auth or repository files."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Signed in as the owner, opened the hosted session URL, refreshed the page, and confirmed candidate review restored the owned session.",
        "observed": "Owner session loaded normally before and after refresh."
      },
      {
        "action": "Signed in as a different account in a separate browser session and opened the same session URL.",
        "observed": "The app returned a blocked state and did not reveal candidate rows."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "tests/api/session-auth.test.ts",
        "cases": [
          {
            "name": "redirects signed-out visitors from protected session routes",
            "verifies": "Protected hosted routes require authentication."
          },
          {
            "name": "blocks non-owner session reads",
            "verifies": "Session deep links are owner-scoped."
          }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- The feature cannot be completed without the user providing missing Supabase/R2/Railway credentials
- Hosted validation requires an external platform setting or account step the worker cannot perform
- The change would require modifying mission boundaries such as moving durable preparation back into Vercel request handlers
- A contract assertion cannot be satisfied without splitting scope across another pending feature
