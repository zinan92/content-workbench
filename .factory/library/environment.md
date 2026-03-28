# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** runtime targets, external repo paths, adapter modes, optional keys, platform-specific setup.
**What does NOT belong here:** service ports/commands (use `.factory/services.yaml`).

---

## Runtime Target

- Repo target: `Node 22 LTS`
- Current machine default observed during planning: `Node v25.8.1`
- Workers should pin repo-local runtime files early and report compatibility blockers immediately if the current shell cannot run the stack reliably.

## External Capability Repos

- `MEDIACRAWLER_ROOT=/Users/wendy/work/content-co/MediaCrawler`
- `DOUYIN_DOWNLOADER_ROOT=/Users/wendy/work/content-co/douyin-downloader-1`
- `SPEC_HOST_ROOT=/Users/wendy/work/content-co/cc-control-tower`

These repos are read-only references/capabilities. Do not modify them from this mission.

## Adapter Modes

Preferred V1 default:

- `CONTENT_WORKBENCH_ADAPTER_MODE=fixtures`

Optional future/local-only modes if stabilized:

- `CONTENT_WORKBENCH_DISCOVERY_MODE=fixtures|mediacrawler`
- `CONTENT_WORKBENCH_PREP_MODE=fixtures|downloader`

If both split knobs are present, they override the combined mode for their respective adapter only.

The product contract is persisted local output. The browser should read saved workspace/artifact state, not stream downloader subprocess output directly.

## Optional Secrets / API Keys

- `OPENAI_API_KEY` is optional and only relevant if the real downloader transcription provider uses the OpenAI API.
- V1 must remain usable without this key by relying on fixture-backed prep or other already-stable local outputs.

## Local Data Expectations

- Session/workspace JSON lives under `data/workspaces/`
- Prepared local artifacts are referenced by stable paths from session/item records
- Do not introduce a database for V1
