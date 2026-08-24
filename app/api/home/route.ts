// app/api/home/route.ts
// HomeSummary Controller — Layer 1 (HTTP only)
//
// GET /api/home — cross-plan view for the signed-in member.
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
import { getHomeSummary } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const data = await getHomeSummary(organizationId, actor.organizationUserId);

    return apiSuccess(data);
  } catch (error) {
    console.error('[GET /api/home]', error);
    return apiInternalError();
  }
}
