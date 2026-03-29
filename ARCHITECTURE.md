# Architecture & Codebase Boundaries

This document defines the architectural layers and boundaries for Content Workbench, especially critical during the hosted migration from V1 local-first to V2 production architecture.

## Table of Contents
- [System Overview](#system-overview)
- [Layered Architecture](#layered-architecture)
- [Persistence Boundaries](#persistence-boundaries)
- [Security Boundaries](#security-boundaries)
- [Migration Strategy](#migration-strategy)
- [Anti-Patterns](#anti-patterns)

---

## System Overview

Content Workbench is evolving from a local-first V1 to a hosted multi-user V2 architecture:

**V1 (Current Baseline)**
- Next.js app with filesystem-backed persistence
- Sessions/items stored in `data/workspaces/`
- Single-user, local development focus

**V2 (Migration Target)**
- Vercel-hosted Next.js web app
- Supabase (Auth + Postgres + RLS) for persistence
- Cloudflare R2 for artifact storage
- Railway worker for durable preparation jobs
- Multi-user with ownership isolation

---

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Pages, Components)     │
│  - app/*, components/*                      │
│  - React Server Components, Client Comp.    │
│  - API Route Handlers                       │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Application Services Layer                 │
│  - lib/services/*                           │
│  - Business logic, workflows, orchestration │
│  - Adapter coordination                     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  Repository Layer (Persistence Abstraction) │
│  - lib/repositories/* (to be created)      │
│  - Hides persistence implementation         │
│  - Enforces ownership boundaries            │
│  - Returns domain types                     │
└─────────────────────┬───────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
┌───────────▼─────────┐  ┌──────▼──────────────┐
│  Hosted Storage     │  │  Legacy Filesystem  │
│  - Supabase Client  │  │  - workspace-store  │
│  - R2 Client        │  │  - data/workspaces/ │
│  (lib/clients/*)    │  │  (lib/services/*)   │
└─────────────────────┘  └─────────────────────┘
```

### Layer Rules

**Presentation → Services**: ✅ Allowed  
Pages, components, and route handlers call service functions.

**Services → Repositories**: ✅ Allowed (once repositories exist)  
Services delegate persistence to repositories.

**Services → Domain**: ✅ Allowed  
Services use domain types and utilities.

**Services → Adapters**: ✅ Allowed  
Services coordinate external capabilities (discovery, preparation).

**Repositories → Clients**: ✅ Allowed  
Repositories use Supabase/R2 clients for hosted persistence.

**Repositories → Legacy Store**: ✅ Allowed (migration phase only)  
Repositories may delegate to `workspace-store` during migration.

**Presentation → Clients**: ❌ **FORBIDDEN**  
Never import `lib/clients/*` from pages, components, or route handlers.

**Presentation → Legacy Store**: ❌ **FORBIDDEN**  
Never import `lib/services/workspace-store` from new code.

**Client Components → Server Clients**: ❌ **FORBIDDEN**  
Never import server-only clients in browser-side components.

---

## Persistence Boundaries

### Current State (V1)

```typescript
// Direct filesystem persistence
import { saveSession, loadSession } from '@/lib/services/workspace-store';

export async function createSession(link: string) {
  const session = { id: generateId(), inputLink: link, ... };
  await saveSession(session); // Writes to data/workspaces/
  return session;
}
```

### Migration Target (V2)

```typescript
// Repository abstraction
import { saveSession, loadOwnedSession } from '@/lib/repositories/session-repository';

export async function createSession(userId: string, link: string) {
  const session = { id: generateId(), ownerId: userId, inputLink: link, ... };
  await saveSession(session); // Writes to Supabase (feature-flagged)
  return session;
}
```

### **CRITICAL RULE: Stop Filesystem Persistence Spread**

During migration, **NEW code must NOT extend filesystem coupling**:

❌ **DON'T** add new `workspace-store` functions  
❌ **DON'T** create new JSON files under `data/workspaces/`  
❌ **DON'T** add filesystem-specific features  
❌ **DON'T** import `workspace-store` in new route handlers  

✅ **DO** create repository abstractions for new features  
✅ **DO** use feature flags for hosted vs legacy paths  
✅ **DO** plan for Supabase-backed implementation from the start  
✅ **DO** wrap existing `workspace-store` calls in repositories  

### File System Deprecation Path

1. **Phase 1**: Create `lib/repositories/` abstractions that wrap `workspace-store`
2. **Phase 2**: Add Supabase implementations behind `useHostedPersistence()` flag
3. **Phase 3**: Enable hosted persistence, validate end-to-end
4. **Phase 4**: Remove `workspace-store` and `data/workspaces/` usage
5. **Phase 5**: Remove filesystem code entirely

---

## Security Boundaries

### Browser-Safe vs Server-Only

**Browser-Safe Variables** (NEXT_PUBLIC_* prefix)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Server-Only Variables** (NO prefix, runtime check enforced)
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_KEY_ID`, `R2_KEY_SECRET`
- `WORKER_SHARED_SECRET`

All server-only variables are protected by runtime checks in `lib/config/env.ts`:

```typescript
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL: Service role key accessed from browser!');
  }
  // ...
}
```

### Client Factories

**Browser-Safe Clients**
```typescript
// OK in browser components
import { createBrowserSupabaseClient } from '@/lib/clients';

export function MyComponent() {
  const supabase = createBrowserSupabaseClient();
  // Uses publishable key, respects RLS
}
```

**Server-Only Clients**
```typescript
// OK in Server Components, API routes, Server Actions
import { createServerSupabaseClient, createR2Client } from '@/lib/clients';

export async function GET() {
  const supabase = createServerSupabaseClient(); // RLS-enforced
  const r2 = createR2Client(); // Artifact storage
}
```

**Admin Clients (RLS Bypass)**
```typescript
// OK in background jobs, admin routes only
import { createAdminSupabaseClient } from '@/lib/clients';

export async function POST() {
  const supabase = createAdminSupabaseClient(); // Bypasses RLS
  // Use for system operations only
}
```

### **CRITICAL RULE: Never Expose Secrets to Browser**

❌ **DON'T** import `lib/clients/r2` in client components  
❌ **DON'T** call `createAdminSupabaseClient()` in browser code  
❌ **DON'T** return raw secrets in API responses  
❌ **DON'T** log secrets to browser console  

✅ **DO** use presigned URLs for browser artifact access  
✅ **DO** validate auth server-side before returning data  
✅ **DO** use RLS for user-scoped queries  
✅ **DO** audit all server-only imports during code review  

---

## Migration Strategy

### Feature Flags

Three flags control incremental migration in `lib/config/env.ts`:

```typescript
// Phase 1: Migrate web persistence
USE_HOSTED_PERSISTENCE=true   // Supabase for sessions/items/drafts

// Phase 2: Migrate artifact storage
USE_HOSTED_STORAGE=true       // R2 for prepared artifacts

// Phase 3: Migrate background jobs
USE_HOSTED_WORKER=true        // Railway for preparation execution
```

### Example: Feature-Flagged Repository

```typescript
import { useHostedPersistence } from '@/lib/config/env';
import * as workspaceStore from '@/lib/services/workspace-store';
import { createServerSupabaseClient } from '@/lib/clients';

export async function loadSession(sessionId: string): Promise<Session | null> {
  if (useHostedPersistence()) {
    // V2: Supabase-backed
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    return data ? mapToSession(data) : null;
  } else {
    // V1: Filesystem-backed
    return await workspaceStore.loadSession(sessionId);
  }
}
```

### Migration Milestones

**Milestone 1: Hosted Foundation**
- ✅ Environment contracts (`lib/config/env.ts`)
- ✅ Client factories (`lib/clients/`)
- ✅ Repository scaffold (`lib/repositories/`)
- 🔲 Supabase Auth integration
- 🔲 Owner-scoped resource authorization

**Milestone 2: Hosted Intake & Review**
- 🔲 Intake session creation in Supabase
- 🔲 Candidate discovery persistence
- 🔲 Selection state in hosted storage

**Milestone 3: Durable Preparation**
- 🔲 Job records in Supabase
- 🔲 Railway worker execution
- 🔲 R2 artifact storage

**Milestone 4: Hosted Studio**
- 🔲 Draft persistence in Supabase
- 🔲 Checklist state in hosted storage
- 🔲 Owner-scoped studio access

**Milestone 5: Deployment & Cutover**
- 🔲 Vercel production deployment
- 🔲 Railway worker deployment
- 🔲 End-to-end hosted validation
- 🔲 Remove legacy filesystem code

---

## Anti-Patterns

### ❌ Direct Database Calls in Routes

**BAD**: Importing Supabase client directly in route handlers
```typescript
// app/api/sessions/route.ts
import { createServerSupabaseClient } from '@/lib/clients';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('sessions').select('*');
  return Response.json(data); // Tight coupling to DB schema
}
```

**GOOD**: Using repository abstraction
```typescript
// app/api/sessions/route.ts
import { findOwnedSessions } from '@/lib/repositories/session-repository';

export async function GET() {
  const userId = await getCurrentUserId();
  const sessions = await findOwnedSessions(userId);
  return Response.json(sessions); // Domain types
}
```

### ❌ Bypassing Repository Layer

**BAD**: Services calling Supabase directly
```typescript
// lib/services/session-service.ts
import { createServerSupabaseClient } from '@/lib/clients';

export async function getSession(id: string) {
  const supabase = createServerSupabaseClient();
  return supabase.from('sessions').select('*').eq('id', id).single();
}
```

**GOOD**: Services calling repositories
```typescript
// lib/services/session-service.ts
import { loadSession } from '@/lib/repositories/session-repository';

export async function getSession(id: string) {
  return await loadSession(id);
}
```

### ❌ Extending Filesystem Coupling

**BAD**: Adding new workspace-store functions during migration
```typescript
// lib/services/workspace-store.ts
export async function saveNewFeatureData(data: NewFeature) {
  await writeJsonFile(getNewFeaturePath(), data); // ❌ Extends coupling
}
```

**GOOD**: Creating hosted-first repositories
```typescript
// lib/repositories/new-feature-repository.ts
export async function saveNewFeatureData(data: NewFeature) {
  if (useHostedPersistence()) {
    const supabase = createServerSupabaseClient();
    await supabase.from('new_features').insert(mapToRow(data));
  } else {
    // Legacy fallback only if needed for migration
    await workspaceStore.saveNewFeatureData(data);
  }
}
```

### ❌ Missing Ownership Enforcement

**BAD**: Fetching sessions without user scope
```typescript
export async function loadSession(sessionId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single(); // ❌ No owner check
  return data;
}
```

**GOOD**: Owner-scoped queries
```typescript
export async function loadOwnedSession(userId: string, sessionId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('owner_id', userId) // ✅ Ownership enforced
    .single();
  return data;
}
```

### ❌ Exposing Secrets to Browser

**BAD**: Importing server-only clients in client components
```typescript
'use client'
import { createR2Client } from '@/lib/clients'; // ❌ Server-only

export function MyComponent() {
  const r2 = createR2Client(); // Runtime error + security violation
}
```

**GOOD**: Server-side artifact URL generation
```typescript
// app/api/artifacts/[id]/download-url/route.ts
import { generatePresignedDownloadUrl } from '@/lib/clients';

export async function GET(request: Request, { params }) {
  const url = await generatePresignedDownloadUrl(params.id, 3600);
  return Response.json({ url }); // ✅ Presigned URL, no secrets
}
```

---

## Summary

**Key Principles**
1. **Layered Architecture**: Presentation → Services → Repositories → Clients
2. **No Filesystem Spread**: New code must not extend `workspace-store` coupling
3. **Repository Abstraction**: Hide persistence behind domain-focused interfaces
4. **Feature Flags**: Use `USE_HOSTED_*` flags for incremental migration
5. **Security by Default**: Enforce browser-safe vs server-only at compile and runtime
6. **Owner Scoping**: All hosted queries must enforce user ownership

**For New Features**
- Start with repository abstraction, not direct persistence
- Plan for Supabase backing from day one
- Use feature flags if legacy path needed during migration
- Never import `workspace-store` or `lib/clients/*` in route handlers
- Always enforce ownership in multi-user contexts

**For Migration Work**
- Wrap existing `workspace-store` in repositories first
- Add Supabase implementations behind feature flags
- Validate both paths until cutover
- Remove legacy path after hosted validation passes
- Update this doc as architecture evolves
