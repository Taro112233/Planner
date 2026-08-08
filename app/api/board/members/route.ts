// app/api/board/members/route.ts
// Board Members Controller — Layer 1 (HTTP only)
//
// GET /api/board/members — active members of the caller's organization, used
// by the task detail panel's assignee picker.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import { apiSuccess, apiUnauthorized, apiRateLimited, apiInternalError } from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { listOrganizationMembers } from '@/services/organization.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    const members = await listOrganizationMembers(organizationId);

    return apiSuccess(members);
  } catch (error) {
    console.error('[GET /api/board/members]', error);
    return apiInternalError();
  }
}
