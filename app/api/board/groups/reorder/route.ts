// app/api/board/groups/reorder/route.ts
// Board Group Reorder Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/groups/reorder — rewrite every column's sortOrder.
// The static `reorder` segment resolves ahead of the sibling [groupId]
// dynamic segment, so there is no routing ambiguity.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { reorderGroups } from '@/services/board.service';
import { getOrCreateDefaultPlan } from '@/services/plan.service';

const ReorderGroupsSchema = z.object({
  /** The COMPLETE ordering — Group.sortOrder is an Int, so every row is renumbered. */
  groupIds: z.array(z.string().min(1)).min(1, 'groupIds is required'),
});

export async function PATCH(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = ReorderGroupsSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId } = await resolveBoardActor(session.user);
    const plan = await getOrCreateDefaultPlan(organizationId);
    const groups = await reorderGroups(organizationId, plan.id, parsed.data.groupIds);

    return apiSuccess(groups, 'Columns reordered');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Group order must include every column exactly once'
    ) {
      return apiBadRequest(error.message);
    }
    console.error('[PATCH /api/board/groups/reorder]', error);
    return apiInternalError();
  }
}
