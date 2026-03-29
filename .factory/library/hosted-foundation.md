# Hosted Foundation

Summary of the hosted platform configuration scaffold introduced in the hosted-foundation milestone.

## What Was Added

### 1. Environment Configuration Contracts (`lib/config/env.ts`)

Explicit typed getters for all hosted environment variables with:
- **Browser-safe variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Server-only variables**: `SUPABASE_SERVICE_ROLE_KEY`, R2 credentials (`R2_KEY_ID`, `R2_KEY_SECRET`), `WORKER_SHARED_SECRET`
- **Runtime safety checks**: Server-only getters throw if called from browser context
- **Migration flags**: `USE_HOSTED_PERSISTENCE`, `USE_HOSTED_STORAGE`, `USE_HOSTED_WORKER`

### 2. Supabase Client Factory (`lib/clients/supabase.ts`)

Three client creation functions with clear separation:
- `createBrowserSupabaseClient()` - Browser-safe, uses publishable key, respects RLS
- `createServerSupabaseClient()` - Server-side, uses publishable key with request context, respects RLS
- `createAdminSupabaseClient()` - Server-only, uses service role key, bypasses RLS

All factories include placeholder implementations that throw descriptive errors until `@supabase/supabase-js` and `@supabase/ssr` are installed.

### 3. R2 Storage Client Factory (`lib/clients/r2.ts`)

Server-only S3-compatible client for Cloudflare R2:
- `createR2Client()` - Main S3 client for artifact operations
- `generatePresignedDownloadUrl()` - Short-lived URLs for browser downloads
- `generatePresignedUploadUrl()` - Short-lived URLs for direct browser uploads (use cautiously)
- `buildArtifactKey()`, `parseArtifactKey()` - Consistent key naming convention

All factories throw if called from browser context. Placeholder implementations included until `@aws-sdk/client-s3` is installed.

### 4. Repository Scaffold (`lib/repositories/README.md`)

Comprehensive guide for creating repository abstractions:
- Repository contract and purpose
- Migration strategy (wrap filesystem → add feature-flagged hosted → remove legacy)
- Owner-scoped query patterns
- Naming conventions and anti-patterns
- Testing guidance

### 5. Architecture Documentation (`ARCHITECTURE.md`)

Complete codebase boundaries guide:
- Layered architecture diagram
- Persistence boundaries and migration rules
- Security boundaries (browser-safe vs server-only)
- Feature flag strategy
- Anti-patterns with good/bad examples
- **Critical rule**: Stop filesystem persistence from spreading

### 6. Environment Template (`.env.local.example`)

Documented template for all environment variables:
- Browser-safe variables
- Server-only secrets
- Migration feature flags
- Legacy adapter modes
- Security checklist and deployment notes

## Key Principles

### 1. Browser-Safe vs Server-Only Separation

**Browser-Safe** (NEXT_PUBLIC_* prefix):
- Supabase URL and publishable key only
- Safe for client components and browser-side code

**Server-Only** (NO prefix, runtime-enforced):
- Service role keys, R2 credentials, worker secrets
- Runtime checks prevent accidental browser exposure
- All client factories validate execution context

### 2. Stop Filesystem Persistence Spread

**CRITICAL MIGRATION RULE**: New code must NOT extend filesystem coupling.

❌ Don't add new `workspace-store` functions  
❌ Don't create new JSON files under `data/workspaces/`  
❌ Don't import `workspace-store` in new route handlers  

✅ Do create repository abstractions  
✅ Do use feature flags for hosted vs legacy  
✅ Do plan for Supabase backing from the start  

### 3. Repository Abstraction Pattern

All persistence goes through repositories, never direct client access from routes/components:

```typescript
// ❌ BAD: Direct client in route
const supabase = createServerSupabaseClient();
const { data } = await supabase.from('sessions').select('*');

// ✅ GOOD: Repository abstraction
const sessions = await findOwnedSessions(userId);
```

### 4. Migration Feature Flags

Three flags enable incremental hosted migration:
- `USE_HOSTED_PERSISTENCE=true` → Supabase for sessions/items/drafts
- `USE_HOSTED_STORAGE=true` → R2 for artifacts
- `USE_HOSTED_WORKER=true` → Railway for preparation jobs

Repositories check flags and delegate to hosted or legacy implementation.

## Migration Path

### Phase 1: Foundation (This Milestone)
✅ Environment contracts  
✅ Client factories  
✅ Repository scaffold  
✅ Architecture documentation  

### Phase 2: Auth & Ownership
🔲 Install Supabase SDK  
🔲 Implement browser/server client factories  
🔲 Add auth guards and session management  
🔲 Implement owner-scoped authorization  

### Phase 3: Web Persistence
🔲 Create session/item/draft repositories  
🔲 Add feature-flagged Supabase implementations  
🔲 Migrate intake, candidate review, and studio  

### Phase 4: Durable Jobs
🔲 Install AWS SDK for R2  
🔲 Implement artifact upload/download  
🔲 Create job repository  
🔲 Wire Railway worker  

### Phase 5: Cutover
🔲 Enable all hosted flags  
🔲 Validate end-to-end hosted flow  
🔲 Remove legacy filesystem code  

## Usage Guidelines

### For New Features

When adding new features during migration:

1. **Start with repository abstraction**, not direct persistence
2. **Plan for Supabase backing** from day one
3. **Use feature flags** if legacy path needed temporarily
4. **Never import** `workspace-store` or `lib/clients/*` in route handlers
5. **Always enforce ownership** in multi-user contexts

### For Migration Work

When migrating existing features:

1. **Wrap** existing `workspace-store` in repositories first
2. **Add** Supabase implementations behind feature flags
3. **Validate** both paths until cutover
4. **Remove** legacy path after hosted validation passes
5. **Update** this doc as architecture evolves

## Security Checklist

Before committing any hosted code:

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in browser-accessible code
- [ ] No R2 credentials in client components
- [ ] All server-only client factories check `typeof window`
- [ ] All owner-scoped queries include `.eq('owner_id', userId)`
- [ ] Presigned URLs use short expiry (≤24 hours)
- [ ] No secrets logged to browser console
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.local.example` has no real credentials

## Files to Create Next

As hosted migration continues, create these files:

**Auth Layer** (Milestone 2):
- `lib/auth/session.ts` - Get current user, require auth
- `lib/auth/guards.ts` - Auth middleware/wrappers

**Repositories** (Milestones 2-4):
- `lib/repositories/session-repository.ts` - Session CRUD + ownership
- `lib/repositories/item-repository.ts` - Item CRUD + ownership
- `lib/repositories/draft-repository.ts` - Draft CRUD + ownership
- `lib/repositories/job-repository.ts` - Job CRUD + status updates

**Storage Layer** (Milestone 3):
- `lib/storage/artifact-uploader.ts` - Server-side R2 uploads
- `lib/storage/artifact-downloader.ts` - Presigned URL generation

## Common Pitfalls

### Pitfall 1: Direct Client Access
❌ Importing Supabase/R2 clients in route handlers bypasses repository abstraction and makes migration harder.

### Pitfall 2: Missing Ownership Checks
❌ Fetching by ID without checking owner allows cross-user access. Always include `.eq('owner_id', userId)`.

### Pitfall 3: Extending Filesystem Coupling
❌ Adding new `workspace-store` functions during migration makes cutover harder. Use repositories instead.

### Pitfall 4: Long-Lived Presigned URLs
❌ Presigned URLs with 7-day expiry can leak access. Use ≤24 hours for downloads, ≤15 minutes for uploads.

### Pitfall 5: Missing Browser Context Check
❌ Forgetting `typeof window !== 'undefined'` check allows secrets to leak to browser bundles.

## Testing Strategy

### Unit Tests
- Mock environment variables for flag testing
- Mock Supabase/R2 clients for repository testing
- Test ownership enforcement in repositories

### Integration Tests
- Test both hosted and legacy paths under feature flags
- Validate browser-safe vs server-only separation
- Verify runtime errors for browser context violations

### End-to-End Tests
- Validate full hosted flow once credentials configured
- Test multi-user ownership isolation
- Verify artifact upload/download through R2

## References

- **Environment contracts**: `lib/config/env.ts`
- **Client factories**: `lib/clients/index.ts`
- **Repository guide**: `lib/repositories/README.md`
- **Architecture doc**: `ARCHITECTURE.md`
- **Environment template**: `.env.local.example`
