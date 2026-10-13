// app/api/members/[memberId]/role/route.ts
// Member Role Controller — Layer 1 (HTTP only)
//
// PATCH /api/members/[memberId]/role  { role: 'ADMIN' | 'MEMBER' }
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, getClientIP, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiRateLimited,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { logSecurityEvent } from '@/lib/server/security-logger';
import { resolveBoardActor } from '@/lib/server/board-actor';
import {
  CANNOT_MANAGE_MEMBER,
  MEMBER_NOT_FOUND,
  updateMemberRole,
} from '@/services/member.service';

const RoleSchema = z.object({ role: z.enum(['ADMIN', 'MEMBER']) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { memberId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }
    const parsed = RoleSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    try {
      const role = await updateMemberRole(organizationId, actor, memberId, parsed.data.role);
      return apiSuccess({ organizationUserId: memberId, role });
    } catch (error) {
      if (error instanceof Error && error.message === CANNOT_MANAGE_MEMBER) {
        logSecurityEvent({
          type: 'invalid_request',
          ip: getClientIP(request),
          path: request.nextUrl.pathname,
          details: { reason: 'role change denied', userId: session.user.id, memberId },
        });
        return apiForbidden(CANNOT_MANAGE_MEMBER);
      }
      if (error instanceof Error && error.message === MEMBER_NOT_FOUND) {
        return apiNotFound(MEMBER_NOT_FOUND);
      }
      throw error;
    }
  } catch (error) {
    console.error('[PATCH /api/members/[memberId]/role]', error);
    return apiInternalError();
  }
}
