# Repositories

This directory contains **repository abstractions** that hide persistence implementation details from the application layer.

## Purpose

Repositories provide a clean boundary between:
- **Domain logic** (what the app needs to do with data)
- **Persistence implementation** (how data is stored and retrieved)

This enables the hosted migration to proceed incrementally:
1. V1: Repositories backed by `data/workspaces/` filesystem
2. V2: Same repository interface, backed by Supabase + R2
3. Application code unchanged during migration

## Repository Contract

Each repository:
- Exposes domain operations (e.g., `saveSession`, `loadSession`, `findOwnedSessions`)
- Hides persistence details (filesystem, Supabase, caching, etc.)
- Enforces ownership boundaries (user-scoped queries, RLS enforcement)
- Returns domain types from `lib/domain/types.ts`
- Handles not-found cases with `null` returns or empty arrays
- Throws errors for unexpected failures

## Migration Strategy

### Phase 1: Wrap Existing Filesystem Store
Create repository interfaces that delegate to `lib/services/workspace-store.ts`:

```typescript
// lib/repositories/session-repository.ts
export async function loadSession(sessionId: string): Promise<Session | null> {
  // Delegates to existing workspace-store for now
  return await workspaceStore.loadSession(sessionId);
}
```

### Phase 2: Add Feature-Flagged Hosted Implementation
Introduce Supabase-backed implementation behind feature flag:

```typescript
import { useHostedPersistence } from '@/lib/config/env';

export async function loadSession(sessionId: string): Promise<Session | null> {
  if (useHostedPersistence()) {
    // New: Supabase-backed
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    return data ? mapToSession(data) : null;
  } else {
    // Legacy: filesystem-backed
    return await workspaceStore.loadSession(sessionId);
  }
}
```

### Phase 3: Remove Legacy Implementation
Once hosted migration is complete and validated:
1. Remove `useHostedPersistence()` checks
2. Remove `lib/services/workspace-store.ts` calls
3. Make Supabase-backed implementation the only path

## Owner-Scoped Repositories

For multi-user hosted mode, repositories must enforce ownership:

```typescript
// Owner-scoped session load
export async function loadOwnedSession(
  userId: string,
  sessionId: string
): Promise<Session | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('owner_id', userId) // Ownership enforcement
    .single();
  
  return data ? mapToSession(data) : null;
}

// List all sessions owned by user
export async function findOwnedSessions(userId: string): Promise<Session[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  
  return data ? data.map(mapToSession) : [];
}
```

## Naming Conventions

- **load***: Get single entity by ID (returns entity or null)
- **find***: Query/search for entities (returns array)
- **save***: Create or update entity
- **update***: Partial update of existing entity
- **delete***: Remove entity

Prefix with scope when needed:
- `loadOwnedSession` - get session if owned by current user
- `findOwnedSessions` - list sessions owned by current user

## Files to Create

As the hosted migration progresses, create these repositories:

- `session-repository.ts` - Session CRUD + ownership
- `item-repository.ts` - Content item CRUD + ownership
- `draft-repository.ts` - Platform draft CRUD + ownership
- `job-repository.ts` - Preparation job CRUD + status updates (worker milestone)

Each repository should start as a thin wrapper around existing `workspace-store.ts` functions, then evolve to feature-flagged Supabase implementations.

## Anti-Patterns

❌ **DON'T** call Supabase clients directly from pages, components, or route handlers:
```typescript
// BAD: Direct Supabase call in route handler
export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('sessions').select('*');
  // ...
}
```

✅ **DO** use repository abstractions:
```typescript
// GOOD: Repository call in route handler
import { findOwnedSessions } from '@/lib/repositories/session-repository';

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  const sessions = await findOwnedSessions(userId);
  // ...
}
```

❌ **DON'T** expose raw database rows to the application:
```typescript
// BAD: Leaking database schema
const { data } = await supabase.from('sessions').select('*');
return Response.json(data); // Raw DB structure
```

✅ **DO** map to domain types:
```typescript
// GOOD: Domain types
const sessions = await findOwnedSessions(userId);
return Response.json(sessions.map(toSessionDTO));
```

## Testing

Repositories should be unit-tested with mocked persistence:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { loadSession } from './session-repository';

describe('session-repository', () => {
  it('loads session from hosted storage when flag enabled', async () => {
    vi.mock('@/lib/config/env', () => ({ useHostedPersistence: () => true }));
    
    const session = await loadSession('test-id');
    expect(session).toBeTruthy();
  });
});
```

## Future: Caching Layer

Once hosted repositories are stable, consider adding a caching layer:
- In-memory cache for hot paths (Next.js cache)
- Redis for distributed caching (if needed)
- Cache invalidation on writes

But start simple: direct Supabase queries without caching.
