// app/api/plan-groups/[planGroupId]/overview/route.ts
// Plan Group Overview Controller — Layer 1 (HTTP only)
//
// GET /api/plan-groups/[planGroupId]/overview — everything the group page
// renders (plans with progress, member roster with open counts, recent
// activity) in a single request.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiNotFound,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { getPlanGroupOverview } from '@/services/plan.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planGroupId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { planGroupId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const overview = await getPlanGroupOverview(organizationId, planGroupId, {
      viewerOrganizationUserId: actor.organizationUserId,
    });

    return apiSuccess(overview);
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan group not found') {
      return apiNotFound('Group not found');
    }
    console.error('[GET /api/plan-groups/[planGroupId]/overview]', error);
    return apiInternalError();
  }
}
