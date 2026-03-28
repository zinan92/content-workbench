---
name: fullstack-web-worker
description: Implements thin full-stack Next.js workbench features with TDD, manual browser verification, and explicit persisted-state checks.
---

# Fullstack Web Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the work procedure.

## When to Use This Skill

Use for features in this mission that touch the standalone workbench app: scaffold/setup, domain logic, route handlers, candidate review UI, preparation flow, studio UI, and adapter-backed persisted-state behavior.

## Required Skills

- `test-driven-development` — invoke before writing implementation code for any feature that changes behavior.
- `agent-browser` — invoke for manual verification whenever the feature changes a browser-visible flow or route.
- `systematic-debugging` — invoke before fixing any failing test, broken route, or unexpected browser/runtime behavior.
- `verification-before-completion` — invoke before handing the feature back as complete.

## Work Procedure

1. Read the assigned feature plus `mission.md`, `AGENTS.md`, `.factory/library/architecture.md`, `.factory/library/environment.md`, and `.factory/library/user-testing.md`.
2. Identify the feature’s `fulfills` assertions and restate the exact user-visible behavior you need to make testable.
3. Invoke `test-driven-development` before implementation. Add failing tests first for the feature’s domain logic, route handlers, or UI behavior whenever practical.
4. Implement only within the repo root. Keep route handlers thin, business logic in `lib/domain`/`lib/services`, and external-repo behavior isolated in `lib/adapters`.
5. If live `MediaCrawler` or `douyin-downloader-1` integration is unstable, keep the adapter contract clean and use fixture-backed behavior rather than blocking the feature.
6. Run focused automated checks during iteration until the feature-specific tests pass.
7. Use `agent-browser` to verify the browser flow affected by the feature. For persisted-state features, include at least one reload or revisit check.
8. Before completion, run the relevant repo validators for the touched scope; if the feature is late-milestone or final-flow work, include broader validation as appropriate.
9. Invoke `verification-before-completion` and only then prepare the handoff.

## Example Handoff

```json
{
  "salientSummary": "Implemented creator-link intake classification plus candidate-route branching with persisted session creation. Added red-green tests for Douyin link parsing and the intake route, then manually verified creator and single-video submissions in the browser.",
  "whatWasImplemented": "Added the intake page form, link classification helpers, intake route handler, and session bootstrap logic so creator-profile links land on candidate review while single-video links land on preparation. Unsupported and unresolvable inputs now preserve the typed value and show recoverable errors without requiring refresh.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {
        "command": "npx vitest run tests/domain/links.test.ts tests/api/intake.route.test.ts",
        "exitCode": 0,
        "observation": "Both the classification and intake route tests passed after implementation."
      },
      {
        "command": "npm run typecheck",
        "exitCode": 0,
        "observation": "No TypeScript errors in the touched intake/session files."
      }
    ],
    "interactiveChecks": [
      {
        "action": "Submitted a supported creator-profile link from `/` and observed navigation to `/sessions/<id>` with candidate review visible and no prep state started.",
        "observed": "Creator flow branched correctly and matched VAL-INTAKE-001/004."
      },
      {
        "action": "Submitted invalid text, observed recoverable error, then replaced it with a valid single-video link and resubmitted.",
        "observed": "Error cleared on retry and the app navigated directly to preparation, matching VAL-INTAKE-005."
      }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "tests/domain/links.test.ts",
        "cases": [
          {
            "name": "classifies creator-profile links",
            "verifies": "Supported Douyin creator URLs map to creator flow."
          },
          {
            "name": "classifies single-video links",
            "verifies": "Supported Douyin video URLs map to single-video flow."
          }
        ]
      },
      {
        "file": "tests/api/intake.route.test.ts",
        "cases": [
          {
            "name": "creates creator sessions and returns candidate route",
            "verifies": "Creator intake produces the review flow."
          },
          {
            "name": "preserves recoverable errors for unsupported input",
            "verifies": "Invalid input stays on intake with actionable feedback."
          }
        ]
      }
    ]
  },
  "discoveredIssues": [
    {
      "severity": "medium",
      "description": "Real MediaCrawler subprocess usage still depends on external browser login state, so fixture mode remains the stable default for this feature.",
      "suggestedFix": "Keep adapter mode configurable and only enable live discovery after dedicated stabilization work."
    }
  ]
}
```

## When to Return to Orchestrator

- The feature requires changing mission boundaries or adding prohibited infrastructure
- The feature depends on modifying `MediaCrawler`, `douyin-downloader-1`, or `cc-control-tower`
- A real adapter path is required but is blocked by external auth/cookies/runtime that cannot be restored locally
- The contract assertions mapped to the feature cannot be satisfied without splitting the feature or changing another pending feature’s scope
