# Environment

Environment variables, external dependencies, and setup notes for the hosted production architecture.

**What belongs here:** env vars, external services, setup notes, credential boundaries.
**What does NOT belong here:** service ports/commands (use `.factory/services.yaml`).

---

## Required Hosted Environment Variables

### Browser-safe web variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Server-only web variables
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_KEY_ID`
- `R2_KEY_SECRET`
- `WORKER_SHARED_SECRET` (or equivalent signed handoff secret if the web app must authenticate to the worker)

### Worker variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_KEY_ID`
- `R2_KEY_SECRET`
- any downloader/transcription credentials introduced during implementation

## External Services

- **Supabase** — Auth, Postgres, RLS
- **Cloudflare R2** — artifact storage
- **Railway** — worker hosting
- **Vercel** — web hosting

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any R2 secret to the browser.
- Buckets should remain private by default; downloads should use signed access or controlled server paths.
- Secrets must not be committed; use local env files and platform env configuration only.

## Migration Notes

- The repo currently contains a local-first baseline with filesystem persistence under `data/workspaces`.
- Hosted migration work should remove application dependence on repo-local persistence rather than extending it.
- End-to-end validation for the new mission requires real hosted credentials to be configured before final milestones can pass.
