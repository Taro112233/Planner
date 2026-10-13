// app/api/members/route.ts
// Members Controller — Layer 1 (HTTP only)
//
// GET /api/members?planGroupId= — the workspace (or one group's) roster with open workload, plus the
// caller's own membership id and role so the page knows what it may change.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { readPlanGroupScope } from '@/lib/server/scope-param';
import { listWorkspaceMembers } from '@/services/member.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const members = await listWorkspaceMembers(organizationId, readPlanGroupScope(request));

    return apiSuccess({
      members,
      viewer: { organizationUserId: actor.organizationUserId, role: actor.role },
    });
  } catch (error) {
    console.error('[GET /api/members]', error);
    return apiInternalError();
  }
}
