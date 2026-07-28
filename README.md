# NextJS Starter 2026

Production-ready Next.js 15 starter template — domain-agnostic, enterprise-grade, and ready to build on.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Neon + Prisma ORM
- **Auth:** Better Auth (email/password + Google OAuth)
- **Security:** Arcjet (rate limiting, bot protection)
- **UI:** Tailwind CSS v4 + Shadcn/UI
- **Rich Text:** Tiptap editor
- **File Storage:** Vercel Blob
- **Notifications:** Sonner toasts

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET, etc.

# 3. Initialize the database
pnpm db:setup

# 4. Start development server
pnpm dev
```

## Environment Variables

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BETTER_AUTH_SECRET="..."           # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ARCJET_KEY="ajkey_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Scripts

```bash
pnpm dev              # Start dev server (Turbopack + schema auto-merge)
pnpm build            # Production build
pnpm type-check       # TypeScript type checking

pnpm schema:merge     # Merge prisma/schemas/* → prisma/schema.prisma
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database (dev)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed demo data
pnpm db:fresh         # Drop + recreate + seed
pnpm db:setup         # Full initialization (generate + push + seed)
```

## Project Structure

```
app/                    Next.js App Router pages and API routes
components/
  shared/               Cross-feature shared components (AppHeader, EmptyState,
                        LoadingState, ConfirmDeleteModal, ConfirmLeaveModal)
  ui/                   Shadcn/UI primitives
  [FeatureName]/        Feature component modules (each has index.ts barrel export)
hooks/
  useCurrentUser.ts     Auth session hook
  useProfile.ts         Profile CRUD
  useAdminUsers.ts      Admin user list
  useDataList.ts        Generic paginated list hook
  useDataDetail.ts      Generic single-record fetch hook
  useMutation.ts        Generic create/update/delete hook
  useTheme.ts           Theme management
lib/
  api-response.ts       apiSuccess(), paginatedSuccess(), apiError() helpers
  pagination.ts         parsePaginationParams(), buildPaginationMeta()
  query-builder.ts      buildSearchWhere(), buildDateRangeWhere(), mergeWhere()
  date-utils.ts         formatDate(), getMonthRange(), getFiscalYear()
  auth-helpers.ts       hasAdminAccess(), normalizeRole()
  role-helpers.ts       RBAC: hasPermission(), canManageUser()
  arcjet-config.ts      Rate limiting (arcjetAuth, arcjetAPI, arcjetUpload)
  security-logger.ts    logSecurityEvent()
  theme-manager.ts      Theme persistence
prisma/
  schema.prisma         Auto-generated (do not edit directly)
  schemas/
    base.prisma         SelectOption model + EntityStatus enum
    better-auth.prisma  User, Session, Account, Verification + UserRole enum
types/
  api.ts                ApiResponse<T>, PaginatedResponse<T>, ApiErrorResponse
  common.ts             EntityStatus, SortOrder, BaseEntity, SelectOption
  profile.ts            UserProfile, UpdateProfileRequest
```

## Database Schema

Edit files in `prisma/schemas/`, then run `pnpm schema:merge && pnpm db:generate`.

**Built-in models:**
- `User` — authentication user with RBAC role (USER / ADMIN / SUPERADMIN)
- `Session`, `Account`, `Verification` — Better Auth tables
- `SelectOption` — runtime-editable dropdown options grouped by category

To add a new domain model, create `prisma/schemas/my-feature.prisma`, add it to `SCHEMA_ORDER` in `scripts/merge-schemas.js` (if it depends on other schemas), then run `pnpm schema:merge`.

## RBAC

Three roles in ascending order of privilege: `USER → ADMIN → SUPERADMIN`

```typescript
import { hasPermission } from '@/lib/role-helpers'

// Guard a component
if (!hasPermission(user.role, 'dashboard.access')) return <div>Access denied</div>

// Guard an API route
if (!hasAdminAccess(currentRole)) return apiForbidden()
```

Add new permission actions to `lib/role-helpers.ts` — `adminActions` or `userActions` array.

## API Response Convention

All API routes return a consistent shape:

```typescript
// Success
{ success: true, data: T, message?: string }

// Paginated list
{ success: true, data: { items: T[], pagination: PaginationMeta } }

// Error
{ success: false, error: string, code?: string, details?: ValidationError[] }
```

Use the helpers in `lib/api-response.ts`:
- `apiSuccess(data)`, `apiCreated(data)`, `paginatedSuccess(items, meta)`
- `apiUnauthorized()`, `apiForbidden()`, `apiNotFound()`, `apiBadRequest()`
- `apiZodError(zodError)` — converts Zod validation errors to a 400 response

## Component Structure

Every feature component lives in its own folder with a barrel `index.ts`:

```
components/MyFeature/
  index.ts                  re-exports only (no JSX or logic)
  MyFeature.tsx             main orchestrator
  MyFeatureSkeleton.tsx     loading state
  MyFeatureDialog.tsx       modal (if needed)
  types.ts                  local types (if needed)
```

Shared components (used across multiple features) go in `components/shared/` and are exported through `components/shared/index.ts`.

## Deployment

Deploy to Vercel:

1. Connect the repository to Vercel
2. Add all environment variables in the Vercel dashboard
3. Deploy — migrations run automatically via `build` script
4. For production DB migrations: `pnpm db:migrate:prod`

See `CLAUDE.md` for the complete developer guide.
