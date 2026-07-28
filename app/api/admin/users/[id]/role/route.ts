// app/api/admin/users/[id]/role/route.ts
// Role Update Controller — Layer 1 (HTTP only)
//
// Responsibilities: auth, role gate, Zod validation, call service, map errors → HTTP.
// 🚫 No prisma.* calls. 🚫 No hierarchy logic (that lives in UserService).

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { hasAdminAccess, normalizeRole } from '@/lib/auth-helpers';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiZodError,
  apiInternalError,
} from '@/lib/api-response';
import { updateUserRole } from '@/services/user.service';
import type { UserRole } from '@prisma/client';

// ─────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────

const UpdateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
});

// ─────────────────────────────────────────────
// PATCH /api/admin/users/[id]/role
// ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const actorRole = normalizeRole((session.user as { role?: unknown }).role);
    if (!hasAdminAccess(actorRole)) return apiForbidden();

    const body = await request.json().catch(() => null);
    if (!body) return apiBadRequest('Request body is required');

    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const updated = await updateUserRole({
      actorId:   session.user.id,
      actorRole: actorRole as UserRole,
      targetId,
      newRole:   parsed.data.role as UserRole,
    });

    return apiSuccess(updated, `Role updated to ${parsed.data.role}`);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'User not found':
          return apiNotFound('User not found');
        case 'Cannot manage a user with equal or higher role':
        case 'Cannot assign a role higher than your own':
          return apiForbidden(error.message);
      }
    }
    console.error('[PATCH /api/admin/users/[id]/role]', error);
    return apiInternalError();
  }
}
