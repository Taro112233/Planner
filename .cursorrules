# 📋 NextJS Starter 2026 — Instruction Guide

## 🎯 Core Identity

**Production-ready Next.js 15 starter template** — domain-agnostic, enterprise-grade, and ready to build on. Includes authentication, security, RBAC, theme system, and a complete set of utilities for building any kind of web application.

**Tech Stack:** Next.js 15 + React 19 + TypeScript + Prisma + PostgreSQL (Neon) + Tailwind v4 + Shadcn/UI + Better Auth + Arcjet

---

## 🏗️ Architecture Overview

### Authentication System
- **Better Auth** (`lib/server/auth.ts`) — Email/password + Google OAuth
- **Session:** 7-day expiry, tracks IP/userAgent
- **User fields:** firstName, lastName, phone, role (USER|ADMIN|SUPERADMIN), status, isActive
- **Hook:** `useCurrentUser()` — user, loading, isAuthenticated, isAdmin, logout, refetch

### Security (Arcjet)
Three instances in `lib/server/arcjet-config.ts`:
1. `arcjetAuth` — Auth endpoints (5 req/15min, no bots)
2. `arcjetAPI` — General APIs (20 req/min, allow search engines)
3. `arcjetUpload` — File uploads (5 req/min, no bots)

Helper functions: `getClientIP()`, `handleArcjetDecision()`, `getRateLimitInfo()`

Security logging (`lib/server/security-logger.ts`): `logSecurityEvent()`, `getSecurityStats()`, `getThreatLevel()`

### RBAC System (`lib/shared/role-helpers.ts`)
**Hierarchy:** USER (1) → ADMIN (2) → SUPERADMIN (3)

Key functions: `hasPermission(role, action)`, `canManageUser()`, `canAccessAdminPanel()`, `getRoleInfo()`

Default permission actions:
```
USER:       profile.view, profile.edit
ADMIN:      + users.view_all, dashboard.access
SUPERADMIN: all actions
```

### Theme System (`lib/client/theme-manager.ts`)
**18 accent colors:** Neutral, Amber, Blue, Cyan, Emerald, Fuchsia, Green, Indigo, Lime, Orange, Pink, Purple, Red, Rose, Sky, Teal, Violet, Yellow

**Base surface:** Stone (locked — near-zero chroma in dark mode, warm-white in light mode)

**Font:** Inter (loaded via `next/font/google` in `app/layout.tsx`)

Two HTML attributes drive the system:
- `data-accent="amber"` → brand/interactive/chart tokens per accent
- `data-theme="dark"|"light"` → surface/background/text tokens

Design tokens in `app/globals.css` — 3-tier system:
- Tier 1: Raw (`--color-primary`, `--color-background`)
- Tier 2: Brand (`--color-brand-primary`, `--color-brand-secondary`)
- Tier 3: Semantic contextual (`--color-content-primary`, `--color-surface-primary`, `--color-interactive-primary`)
- Chart: `--color-chart-1` … `--color-chart-5` (harmonised per accent)

Hook: `useTheme()` — `activeAccent`, `mode`, `isDark`, `currentAccent`, `accents[]`, `changeAccent()`, `toggleMode()`

**Dark mode rule:** All surface/background tokens use `oklch(L 0 0)` — zero chroma, pure gray. Accent color appears only on buttons, interactive elements, focus rings, and chart series. Pages must NOT apply brand-coloured background overlays in dark mode (use `dark:hidden` on gradient overlays).

**localStorage keys:** `nextjs-starter-accent`, `nextjs-starter-mode`

### File Handling
- **Validation** (`lib/server/file-validation.ts`): `validateFile()`, `validateFiles()`, `sanitizeFilename()`
- **Upload** (`lib/server/file-upload.ts`): `uploadFile()`, `uploadMultipleFiles()` → Vercel Blob

---

## 📁 Project Structure

```
app/
├── api/
│   ├── auth/[...all]/route.ts     # Better Auth handler
│   ├── admin/users/route.ts       # GET users (paginated)
│   ├── admin/users/[id]/role/     # PATCH role
│   ├── profile/route.ts           # GET, PATCH profile
│   └── profile/avatar/route.ts    # POST avatar upload
├── login/page.tsx
├── register/page.tsx
├── profile/page.tsx
├── admin/page.tsx
├── globals.css                    # Semantic design system
└── layout.tsx

components/
├── ui/                            # Shadcn/UI primitives (flat, no folder wrapping)
├── shared/                        # Cross-feature shared components
│   ├── index.ts                   # ← barrel export (import from '@/components/shared')
│   ├── AppHeader.tsx
│   ├── EmptyState.tsx
│   ├── LoadingState.tsx
│   ├── ConfirmDeleteModal.tsx     # Generic delete confirmation dialog
│   └── ConfirmLeaveModal.tsx      # Unsaved-changes warning dialog
├── AdminPage/                     # Feature component module
│   ├── index.ts                   # barrel export
│   ├── AdminPage.tsx (or index.tsx)
│   ├── AdminSkeleton.tsx
│   ├── UserTable.tsx
│   ├── UserCardList.tsx
│   ├── RoleSelector.tsx
│   └── PaginationBar.tsx
├── ProfilePage/                   # Feature component module
│   ├── index.tsx
│   ├── ProfileHeader.tsx
│   ├── PersonalInfoSection.tsx
│   ├── AccountSection.tsx
│   └── ProfileSkeleton.tsx
├── RichTextEditor/
│   ├── index.ts
│   ├── RichTextEditor.tsx
│   ├── RichTextViewer.tsx
│   └── MenuBar.tsx
├── theme/
│   └── CompactThemeSelector.tsx
└── AuthGuard.tsx

hooks/
├── useCurrentUser.ts              # Auth session hook
├── useProfile.ts                  # Profile CRUD
├── useAdminUsers.ts               # Admin user list
├── useTheme.ts                    # Theme state
├── use-mobile.ts                  # Viewport breakpoint
├── useDataList.ts                 # ★ Generic paginated list hook
├── useDataDetail.ts               # ★ Generic single-record fetch hook
└── useMutation.ts                 # ★ Generic create/update/delete hook

lib/
├── server/                        # Node-runtime only — not Edge-safe
│   ├── auth.ts                    # Better Auth config
│   ├── arcjet-config.ts           # 3 Arcjet instances
│   ├── security-logger.ts         # Security event logging
│   ├── file-upload.ts             # Vercel Blob upload
│   ├── file-validation.ts         # File type/size guards
│   ├── prisma.ts                  # Prisma singleton (Neon adapter)
│   ├── api-response.ts            # ★ apiSuccess(), apiError(), paginatedSuccess()
│   ├── pagination.ts              # ★ parsePaginationParams(), buildPaginationMeta()
│   └── query-builder.ts           # ★ buildSearchWhere(), buildDateRangeWhere(), mergeWhere()
├── client/                        # Browser-only — imported by 'use client' code
│   ├── auth-client.ts             # Client-side auth
│   ├── theme-manager.ts           # Theme persistence
│   └── utils.ts                   # cn() utility
└── shared/                        # Framework-agnostic pure logic, either side
    ├── auth-helpers.ts            # Role checks (hasAdminAccess, normalizeRole)
    ├── role-helpers.ts            # RBAC functions
    ├── rich-text-utils.ts         # Tiptap text extraction
    └── date-utils.ts              # ★ formatDate(), getMonthRange(), getFiscalYear()

types/
├── profile.ts                     # UserProfile, UpdateProfileRequest
├── api.ts                         # ★ ApiResponse<T>, PaginatedResponse<T>, ApiErrorResponse
├── common.ts                      # ★ EntityStatus, SortOrder, SelectOption, BaseEntity
└── cookie.d.ts

prisma/
├── schema.prisma                  # Auto-generated (run pnpm schema:merge)
└── schemas/
    ├── base.prisma                # ★ SelectOption model + EntityStatus enum
    └── better-auth.prisma         # User, Session, Account, Verification + UserRole enum

scripts/
├── merge-schemas.js               # Merges prisma/schemas/* → schema.prisma
└── merge-seeds.js
```

> ★ = new in this upgrade

---

## 🧩 Component Module Structure (MANDATORY)

Every feature component **must live in its own folder** with a barrel `index.ts`:

```
components/
└── FeatureName/                    # PascalCase
    ├── index.ts                    # re-exports only (no JSX or logic)
    ├── FeatureName.tsx             # main orchestrator / container
    ├── FeatureNameSkeleton.tsx     # loading skeleton
    ├── FeatureNameHeader.tsx       # header section (if needed)
    ├── FeatureNameFilters.tsx      # filter controls (if needed)
    ├── FeatureNameTable.tsx        # table (if needed)
    ├── FeatureNameDialog.tsx       # modal/dialog (if needed)
    └── types.ts                    # local types (if needed)
```

**File rules:**

| File | Purpose | Must NOT |
|------|---------|----------|
| `index.ts` | re-export only | contain JSX, state, logic |
| `FeatureName.tsx` | compose sub-components | exceed ~300 lines |
| `FeatureNameSkeleton.tsx` | render loading UI | fetch data itself |
| `[SubComponent].tsx` | accept props and render | duplicate parent logic |
| `types.ts` | local interfaces/types | import types from other features |

**Naming convention:** always prefix with the folder name:
`FeatureNameSkeleton.tsx`, `FeatureNameHeader.tsx`, `FeatureNameDialog.tsx` ✅

**Shared components** that are used across features go in `components/shared/` and are exported through `components/shared/index.ts`.

**Exceptions:**
- `components/ui/` — Shadcn primitives, flat single-file, no folder needed
- Components under 50 lines can be a single file but must still live in their own folder

---

## 🔐 Database Schema

```prisma
// Auto-generated from prisma/schemas/*
// Run: pnpm schema:merge

model User {
  id, name, email, emailVerified, image
  firstName, lastName, phone
  role (UserRole: USER|ADMIN|SUPERADMIN)
  status, isActive, lastLogin
  sessions[], accounts[]
}

// ★ Generic configurable dropdown values
model SelectOption {
  id, category, value, label
  sortOrder, isActive, metadata (JSON)
  // @@unique([category, value])
}

enum UserRole  { USER  ADMIN  SUPERADMIN }
enum EntityStatus { ACTIVE  INACTIVE  ARCHIVED }
```

**Commands:**
```bash
pnpm schema:merge      # Merge prisma/schemas/* → schema.prisma
pnpm db:generate       # Generate Prisma client (after schema change)
pnpm db:push           # Push schema to database (dev)
pnpm db:studio         # Open Prisma Studio
pnpm db:fresh          # Full reset + seed with demo data
```

**Adding new models:** create `prisma/schemas/my-feature.prisma`, add the filename to `SCHEMA_ORDER` in `scripts/merge-schemas.js` if it has dependencies, then run `pnpm schema:merge && pnpm db:generate`.

---

## 🚀 Common Workflows

### Adding a protected page
```typescript
// app/new-page/page.tsx
'use client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { LoadingState } from '@/components/shared'

export default function NewPage() {
  const { user, loading } = useCurrentUser()
  if (loading) return <LoadingState />
  if (!user) return null  // AuthGuard handles redirect
  return <div>Content</div>
}
```
Then add the route to `PROTECTED_ROUTE_PREFIXES` in `middleware.ts`.

### Adding an API route (standard pattern)
```typescript
// app/api/items/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import { arcjetAPI } from '@/lib/server/arcjet-config'
import { parsePaginationParams, buildPaginationMeta } from '@/lib/server/pagination'
import { buildSearchWhere } from '@/lib/server/query-builder'
import {
  apiSuccess, paginatedSuccess,
  apiUnauthorized, apiForbidden,
  apiZodError, apiInternalError,
} from '@/lib/server/api-response'

const CreateSchema = z.object({ name: z.string().min(1) })

// GET /api/items  — paginated list
export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request)
    if (decision.isDenied()) return apiRateLimited()

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return apiUnauthorized()

    const { page, limit, skip, search } = parsePaginationParams(new URL(request.url))
    const where = buildSearchWhere(search, ['name'])

    const [items, total] = await Promise.all([
      prisma.item.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.item.count({ where }),
    ])

    return paginatedSuccess(items, { page, limit, total })
  } catch (e) {
    console.error(e)
    return apiInternalError()
  }
}

// POST /api/items  — create
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return apiUnauthorized()

    const body = await request.json().catch(() => null)
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return apiZodError(parsed.error)

    const item = await prisma.item.create({ data: parsed.data })
    return apiCreated(item)
  } catch (e) {
    return apiInternalError()
  }
}
```

### Using the generic list hook
```typescript
// hooks/useMyFeatureList.ts
import { useDataList } from '@/hooks/useDataList'
import type { MyItem } from '@/types/my-feature'

export function useMyFeatureList() {
  return useDataList<MyItem>('/api/items', { page: 1, limit: 20 })
}

// In component:
const { items, pagination, loading, error, setFilters } = useMyFeatureList()
setFilters({ search: 'foo', page: 2 })
```

### Using the generic mutation hook
```typescript
import { useMutation } from '@/hooks/useMutation'
import { toast } from 'sonner'

const { mutate, loading } = useMutation()

const handleCreate = async (data: CreateItemPayload) => {
  const result = await mutate('/api/items', { method: 'POST', body: data })
  if (result) toast.success('Created!')
}

const handleDelete = async (id: string) => {
  await mutate(`/api/items/${id}`, { method: 'DELETE' })
}
```

### Using shared modals
```typescript
import { ConfirmDeleteModal, ConfirmLeaveModal } from '@/components/shared'

// Delete confirmation
<ConfirmDeleteModal
  open={showDelete}
  title="Delete project?"
  description="This will permanently remove the project and all its data."
  onConfirm={handleDelete}
  onCancel={() => setShowDelete(false)}
  loading={isDeleting}
/>

// Leave without saving
<ConfirmLeaveModal
  open={showLeave}
  onConfirm={() => router.back()}
  onCancel={() => setShowLeave(false)}
/>
```

### Adding a role permission
```typescript
// lib/shared/role-helpers.ts — add to adminActions array
'new-feature.access',

// In component or API
if (!hasPermission(user.role, 'new-feature.access')) {
  return <div>Access denied</div>
}
```

### Adding a configurable dropdown (SelectOption)
```typescript
// Seed options via API or prisma seed
await prisma.selectOption.createMany({
  data: [
    { category: 'priority', value: 'HIGH',   label: 'High',   sortOrder: 1 },
    { category: 'priority', value: 'MEDIUM', label: 'Medium', sortOrder: 2 },
    { category: 'priority', value: 'LOW',    label: 'Low',    sortOrder: 3 },
  ],
  skipDuplicates: true,
})

// Fetch in API route
const options = await prisma.selectOption.findMany({
  where: { category: 'priority', isActive: true },
  orderBy: { sortOrder: 'asc' },
})
```

---

## ✅ Critical Patterns

### Server Component First
Default to React Server Components. Use `'use client'` only when you need `useState`, `useEffect`, event handlers, or browser APIs.

### Type Safety
```typescript
import { User, UserRole } from '@prisma/client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { BaseEntity } from '@/types/common'
// Always use Zod for API input validation
```

### API Response Format
```typescript
// Success:   { success: true, data: T, message?: string }
// Paginated: { success: true, data: { items: T[], pagination: PaginationMeta } }
// Error:     { success: false, error: string, code?: string, details?: ValidationError[] }
```

### Loading States
```typescript
if (loading) return <FeatureNameSkeleton />
if (error)   return <Alert variant="destructive">{error}</Alert>
if (!data)   return <EmptyState title="No items" />
```

### Semantic Design Tokens
```typescript
// ✅ Semantic tokens (theme-aware, works across all 18 accents + 2 modes)
className="bg-surface-primary text-content-primary border-border-primary"
className="bg-interactive-primary text-primary-foreground"   // brand button
className="text-content-secondary"                           // subdued text
className="bg-surface-secondary border-border-subtle"        // card/panel

// ✅ Chart tokens (auto-harmonised per accent)
"var(--color-chart-1)" … "var(--color-chart-5)"

// ❌ Raw Tailwind colors (breaks accent/mode switching)
className="bg-gray-900 text-white border-gray-700"
className="bg-blue-500 text-white"   // hardcoded, not theme-aware

// ❌ Brand gradient on backgrounds in dark mode
className="bg-linear-to-br from-brand-primary/10 ..."   // must add dark:hidden
```

### Security Checklist
- ✅ Arcjet on every API route (`arcjetAPI.protect(request)`)
- ✅ Zod validation for all request bodies
- ✅ `auth.api.getSession()` on every protected API route
- ✅ `hasPermission()` for role-gated actions
- ✅ `sanitizeFilename()` before storing uploads
- ✅ `logSecurityEvent()` for suspicious activity
- ✅ Never use raw SQL — use Prisma only

---

## 🌍 Environment Variables

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BETTER_AUTH_SECRET="..."        # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ARCJET_KEY="ajkey_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🎓 Key Principles

1. **Server-first** — Default to RSC; use `'use client'` only when necessary
2. **Type-safe** — TypeScript strict mode, Prisma-generated types, Zod for all inputs
3. **Secure by default** — Arcjet on all routes, validate everything, log security events
4. **Semantic design** — 3-tier token system, never hardcode colors
5. **Modular components** — Feature folders with `index.ts` barrel exports
6. **Generic utilities** — Reuse `useDataList`, `useMutation`, `apiSuccess`, `parsePaginationParams`
7. **Error-resilient** — Handle all states: loading → skeleton, error → alert, empty → EmptyState
8. **Domain-agnostic** — Template code must never contain business-domain logic

---

## 📚 Quick Reference

**Auth:** `useCurrentUser()` → user, loading, isAuthenticated, logout, refetch

**Data fetching:** `useDataList<T>(endpoint)`, `useDataDetail<T>(endpoint, id)`, `useMutation()`

**Profile:** `useProfile()` → profile, updateProfile(), uploadAvatar()

**Theme:** `useTheme()` → `activeAccent`, `mode`, `isDark`, `currentAccent`, `accents[]`, `changeAccent(accentId)`, `toggleMode()`

**RBAC:** `hasPermission(role, action)`, `canManageUser(currentRole, targetRole)`

**API helpers:** `apiSuccess()`, `paginatedSuccess()`, `apiUnauthorized()`, `apiForbidden()`, `apiZodError()`

**Pagination:** `parsePaginationParams(url)`, `buildPaginationMeta({ page, limit, total })`

**Query builder:** `buildSearchWhere(search, fields)`, `buildDateRangeWhere(start, end, field)`, `mergeWhere(...clauses)`

**Date utils:** `formatDate()`, `formatRelativeTime()`, `getMonthRange()`, `getFiscalYear()`

**Security:** `arcjetAuth`, `arcjetAPI`, `arcjetUpload`, `logSecurityEvent()`

**Files:** `validateFile()`, `uploadFile()`, `sanitizeFilename()`

**Rich Text:** `<RichTextEditor>`, `<RichTextViewer>`, `extractTextFromRichText()`

**Shared modals:** `<ConfirmDeleteModal>`, `<ConfirmLeaveModal>`

---

## 🧪 API Development & Testing Guidelines (Service Layer Pattern)

Every API feature follows a strict three-layer separation. Each layer has one job and hard restrictions on what it may import.

### Layer overview

```
app/api/**/route.ts          ← Layer 1: Controller  (HTTP only)
services/*.service.ts        ← Layer 2: Service     (business logic + Prisma)
services/*.service.test.ts   ← Layer 3: Unit tests  (mock Prisma, no real DB)
```

---

### Layer 1 — Controller (`app/api/**/route.ts`)

**Allowed:**
- Read `NextRequest` (headers, params, body, searchParams)
- Verify authentication via `auth.api.getSession()`
- Validate request bodies with Zod schemas
- Call one or more Service functions
- Map Service errors (thrown `Error` objects) → `NextResponse` with the correct HTTP status

**Forbidden:**
- 🚫 `prisma.*` calls of any kind
- 🚫 Business logic or data transformations
- 🚫 Knowing anything about the database schema

```typescript
// app/api/items/route.ts  — CONTROLLER example
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/server/auth'
import { apiSuccess, apiCreated, apiUnauthorized,
         apiNotFound, apiZodError, apiInternalError } from '@/lib/server/api-response'
import { getItemById, createItem } from '@/services/item.service'

const CreateSchema = z.object({ name: z.string().min(1) })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return apiUnauthorized()

    const { id } = await params
    const item = await getItemById(id)             // ← service call only
    return apiSuccess(item)
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found')
      return apiNotFound('Item not found')
    console.error('[GET /api/items/[id]]', error)
    return apiInternalError()
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return apiUnauthorized()

    const body = await request.json().catch(() => null)
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return apiZodError(parsed.error)

    const item = await createItem(parsed.data)     // ← service call only
    return apiCreated(item)
  } catch (error) {
    return apiInternalError()
  }
}
```

---

### Layer 2 — Service (`services/*.service.ts`)

**Allowed:**
- All Prisma operations (`prisma.item.findUnique`, `prisma.item.create`, …)
- Business logic, calculations, data transformations
- Calling other services
- Throwing `new Error('descriptive message')` on failure

**Forbidden:**
- 🚫 `import { NextRequest } from 'next/server'` or any Next.js import
- 🚫 HTTP status codes
- 🚫 Reading request headers or URL params

```typescript
// services/item.service.ts  — SERVICE example
import { prisma } from '@/lib/server/prisma'

export interface ItemData {
  id: string; name: string; createdAt: Date
}

/**
 * @throws Error('Item not found')
 */
export async function getItemById(id: string): Promise<ItemData> {
  const item = await prisma.item.findUnique({ where: { id } })
  if (!item) throw new Error('Item not found')
  return item
}

export async function createItem(data: { name: string }): Promise<ItemData> {
  // Example business rule: names must be unique (Prisma unique constraint
  // will throw P2002 — handle that in a wrapper if needed)
  return prisma.item.create({ data })
}
```

---

### Layer 3 — Unit Tests (`services/*.service.test.ts`)

**Setup:** Import `@/tests/prisma-mock` **before** the service. This triggers `vi.mock('@/lib/server/prisma')` which intercepts every `import { prisma }` in the service.

**Pattern for every test file:**
```typescript
// services/item.service.test.ts
import { describe, it, expect } from 'vitest'

// 1. Import mock FIRST (triggers vi.mock hoisting)
import '@/tests/prisma-mock'
import { prismaMock } from '@/tests/prisma-mock'

// 2. Import the service under test
import { getItemById, createItem } from './item.service'

const ITEM = { id: 'item-1', name: 'Widget', createdAt: new Date() }

describe('getItemById', () => {
  it('returns the item when it exists', async () => {
    prismaMock.item.findUnique.mockResolvedValue(ITEM)
    const result = await getItemById('item-1')
    expect(result.id).toBe('item-1')
  })

  it('throws "Item not found" when ID is unknown', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null)
    await expect(getItemById('ghost')).rejects.toThrow('Item not found')
  })
})

describe('createItem', () => {
  it('creates and returns the new item', async () => {
    prismaMock.item.create.mockResolvedValue(ITEM)
    const result = await createItem({ name: 'Widget' })
    expect(result.name).toBe('Widget')
    expect(prismaMock.item.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Widget' } })
    )
  })
})
```

---

### Test scripts

```bash
pnpm test               # Run all tests once (CI mode)
pnpm test:watch         # Watch mode (development)
pnpm test:coverage      # Run with V8 coverage report
```

Coverage thresholds are enforced at **80 % lines / functions** for all files in `services/`.

---

### Error contract between layers

Services throw plain `Error` objects with a consistent message string. Controllers switch on `error.message` to pick the right HTTP status:

| Service throws | Controller returns |
|---|---|
| `'User not found'` | `apiNotFound()` → 404 |
| `'Cannot manage a user with equal or higher role'` | `apiForbidden()` → 403 |
| `'Cannot assign a role higher than your own'` | `apiForbidden()` → 403 |
| `'Duplicate entry'` | `apiConflict()` → 409 |
| anything else | `apiInternalError()` → 500 |

Define new error message strings as **string constants** in the service file when a feature needs custom error codes.

---

### Checklist for adding a new API feature

1. Create `services/my-feature.service.ts` — all Prisma + business logic
2. Create `app/api/my-feature/route.ts` — HTTP shell that calls the service
3. Create `services/my-feature.service.test.ts` — happy path + all error throws
4. Add new route prefixes to `PROTECTED_ROUTE_PREFIXES` in `middleware.ts` if needed
5. Run `pnpm test` — all tests must pass before merging

---

## 🚢 Deployment (Vercel)

1. Connect repo to Vercel
2. Set all environment variables
3. Auto-deploy on push to main
4. Run migrations: `pnpm db:migrate:prod`
