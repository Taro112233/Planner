// app/api/board/groups/route.ts
// Board Groups Controller — Layer 1 (HTTP only)
//
// POST /api/board/groups — add a new Kanban column to the caller's organization.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiNotFound,
  apiRateLimited,
  apiBadRequest,
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createGroup, listGroups } from '@/services/board.service';
import { getOrCreateDefaultPlan, getPlan } from '@/services/plan.service';

/**
 * The plan a board request acts on: `?planId=` when the caller names one,
 * otherwise the organization's default (provisioned on first use).
 *
 * @throws Error('Plan not found') — an unknown or foreign planId
 */
async function resolvePlanId(request: NextRequest, organizationId: string): Promise<string> {
  const requested = new URL(request.url).searchParams.get('planId');
  if (requested) {
    const plan = await getPlan(organizationId, requested);
    return plan.id;
  }
  const plan = await getOrCreateDefaultPlan(organizationId);
  return plan.id;
}

const CreateGroupSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(60, 'name is too long'),
  color: z.string().trim().min(1).max(20).optional(),
});

// GET /api/board/groups — lightweight column list (id/name/color/sortOrder only),
// for contexts without a full board fetch, e.g. the standalone TaskPage.
export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    const planId = await resolvePlanId(request, organizationId);
    const groups = await listGroups(organizationId, planId);

    return apiSuccess(groups);
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan not found') {
      return apiNotFound('Plan not found');
    }
    console.error('[GET /api/board/groups]', error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
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

    const parsed = CreateGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const planId = await resolvePlanId(request, organizationId);
    const group = await createGroup(
      organizationId,
      planId,
      parsed.data.name,
      parsed.data.color ?? null,
      actor
    );

    return apiCreated(group);
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan not found') {
      return apiNotFound('Plan not found');
    }
    if (error instanceof Error && error.message === 'Duplicate entry') {
      return apiConflict('A column with this name already exists');
    }
    console.error('[POST /api/board/groups]', error);
    return apiInternalError();
  }
}
