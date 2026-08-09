// app/api/admin/users/route.ts
// Admin Users Controller — Layer 1 (HTTP only)
//
// Responsibilities: auth, role gate, pagination parsing, call service.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { hasAdminAccess, normalizeRole } from '@/lib/shared/auth-helpers';
import { parsePaginationParams } from '@/lib/server/pagination';
import {
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from '@/lib/server/api-response';
import { listUsers } from '@/services/user.service';
import type { UserRole } from '@prisma/client';

// ─────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const actorRole = normalizeRole((session.user as { role?: unknown }).role);
    if (!hasAdminAccess(actorRole)) return apiForbidden();

    const url = new URL(request.url);
    const { page, limit, skip, search } = parsePaginationParams(url);
    const roleFilter = url.searchParams.get('role') as UserRole | null;

    const result = await listUsers({ page, limit, skip, search, role: roleFilter });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[GET /api/admin/users]', error);
    return apiInternalError();
  }
}
