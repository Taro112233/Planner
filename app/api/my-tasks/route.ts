// app/api/my-tasks/route.ts
// MyTasks Controller — Layer 1 (HTTP only)
//
// GET /api/my-tasks — cross-plan view for the signed-in member.
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
import { getMyTasks } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const data = await getMyTasks(organizationId, actor.organizationUserId);

    return apiSuccess(data);
  } catch (error) {
    console.error('[GET /api/my-tasks]', error);
    return apiInternalError();
  }
}
