# Owner-Scoped Resource Authorization

## Overview

This document describes the owner-scoped authorization layer added to Content Workbench for the hosted migration. This layer ensures that sessions, items, drafts, and all workflow mutations are isolated per authenticated user.

## Architecture

### Repository Layer

Created three new repositories in `lib/repositories/`:

1. **session-repository.ts** - Owner-scoped session operations
2. **item-repository.ts** - Owner-scoped item operations  
3. **draft-repository.ts** - Owner-scoped draft operations

Each repository:
- Accepts `userId` parameter for all operations
- Enforces ownership at the data access layer
- Returns `null` or empty arrays for non-owned resources
- Never leaks cross-account data
- Feature-flagged for migration (`useHostedPersistence()`)

### Migration Strategy

The repositories use a feature flag `USE_HOSTED_PERSISTENCE` to enable incremental migration:

**Phase 1 (Current)**: Flag OFF (default)
- Repositories delegate to existing `workspace-store.ts`
- `owner_id` is stored alongside data in filesystem JSON
- Ownership checks happen at repository layer
- No Supabase queries yet

**Phase 2 (Future)**: Flag ON
- Repositories switch to Supabase client
- RLS policies enforce ownership server-side
- `owner_id` becomes database column
- Filesystem code deprecated

### Route Handler Updates

All API routes now enforce authentication and ownership:

- `app/api/intake/route.ts` - Stores owner_id on session creation
- `app/api/sessions/[sessionId]/route.ts` - Loads only owned sessions
- `app/api/items/[itemId]/route.ts` - Loads only owned items
- `app/api/sessions/[sessionId]/selection/route.ts` - Owner-only selection updates
- `app/api/sessions/[sessionId]/prepare/route.ts` - Owner-only prep start
- `app/api/sessions/[sessionId]/prepare/[itemId]/retry/route.ts` - Owner-only retry
- `app/api/items/[itemId]/drafts/route.ts` - Owner-only draft updates

All routes:
1. Call `requireUserId()` at entry
2. Pass `userId` to repository functions
3. Return 404 for non-owned resources (no data leakage)

### Service Layer Updates

Updated services to accept and pass through `userId`:

- `lib/services/discovery-service.ts` - Passes userId to repositories
- `lib/services/prepare-service.ts` - Passes userId to repositories

## Validation Contract Fulfillment

This implementation addresses the following validation assertions:

- **VAL-AUTH-004**: Sessions created under signed-in operator's account
- **VAL-AUTH-005**: Session deep links owner-scoped, blocked for others
- **VAL-AUTH-006**: Studio item links owner-scoped, blocked for others
- **VAL-AUTH-007**: Cross-account isolation in lists/navigation
- **VAL-AUTH-008**: Blocked state without leaking protected details
- **VAL-AUTH-009**: Draft/workflow state persists for same account only
- **VAL-AUTH-011**: Non-owner write actions blocked server-side

## Current State

### Completed

✅ Repository abstraction layer with ownership enforcement
✅ All route handlers enforce authentication
✅ Services updated to pass userId
✅ Feature-flagged for safe migration
✅ TypeScript compilation passes

### In Progress

🔄 Existing tests need auth mocking to pass
🔄 Integration tests for cross-account blocking needed
🔄 Browser validation with agent-browser pending

### Known Issues

1. **Test Auth Mocking**: Existing API tests fail because they don't mock `requireUserId()`. A test helper has been created at `tests/helpers/auth-mock.ts` but needs to be integrated into each test file.

2. **Repository Unit Tests**: The new repository tests in `tests/repositories/` need mocking setup for the feature flag and may need adjustment for the filesystem-based fallback path.

3. **Prepare Service Tests**: These need userId parameter added (partially complete, some calls updated via sed).

## Next Steps for Future Workers

### 1. Fix Test Suite

Add auth mocking to all API route tests:

```typescript
import { mockAuth, TEST_USER_ID } from '@/tests/helpers/auth-mock';

beforeEach(() => {
  mockAuth();
});
```

### 2. Add Owner-Scoped Integration Tests

Create tests that verify:
- User A can access their own resources
- User B cannot access User A's resources
- Non-owner requests return 404 (not 403 to avoid data leakage)
- Selection/prepare/retry/draft mutations blocked for non-owners

### 3. Browser Validation

Use `agent-browser` to validate:
- Sign in as User A, create session, verify access
- Sign in as User B, attempt to access User A's session URL
- Verify User B sees blocked state without details
- Verify each user sees only their own sessions

### 4. Enable Hosted Persistence

Once Supabase schema is ready:
1. Add database migrations for owner_id columns
2. Implement RLS policies
3. Complete Supabase implementations in repositories
4. Set `USE_HOSTED_PERSISTENCE=true`
5. Validate end-to-end with hosted DB

## API Changes

### Breaking Changes

All API routes now require authentication via middleware. Previously anonymous access is no longer supported.

### New Parameters

Services now accept `userId`:
```typescript
// Before
await prepareItems(sessionId, itemIds);

// After
await prepareItems(sessionId, itemIds, userId);
```

### Repository Functions

New owner-scoped repository functions:
```typescript
// Sessions
await saveSession(session, userId);
await loadOwnedSession(userId, sessionId);
await findOwnedSessions(userId);
await updateSessionSelection(userId, sessionId, selectedIds);

// Items
await saveItem(item, userId);
await loadOwnedItem(userId, sessionId, itemId);
await loadOwnedItems(userId, sessionId);
await findOwnedItemById(userId, itemId);

// Drafts
await updatePlatformDraft(userId, sessionId, itemId, draft);
await loadOwnedItemWithDrafts(userId, itemId);
await findOtherReadyItems(userId, sessionId, currentItemId);
```

## Security Considerations

1. **No Data Leakage**: Non-owner requests return 404, not 403, to avoid confirming resource existence
2. **Server-Side Enforcement**: All checks happen server-side; client never sees foreign data
3. **Defense in Depth**: Both repository layer AND route handlers check ownership
4. **Feature Flag Safety**: Migration can be rolled back by toggling `USE_HOSTED_PERSISTENCE`

## Performance Notes

- Filesystem-based ownership checks have minimal overhead (single JSON field read)
- Supabase RLS enforcement will be efficient with proper indexes
- Cross-session item lookups (`findItemById`) scan directories but are rare (studio entry only)

## References

- Validation Contract: `.factory/missions/.../validation-contract.md`
- Architecture Doc: `ARCHITECTURE.md`
- Repository README: `lib/repositories/README.md`
- Environment Config: `lib/config/env.ts`
