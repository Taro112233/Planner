// app/api/plan-groups/[planGroupId]/route.ts
// Plan Group Controller — Layer 1 (HTTP only)
//
// PATCH  /api/plan-groups/[planGroupId] — rename / recolor / describe
// DELETE /api/plan-groups/[planGroupId] — delete; its plans are detached, not deleted
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
  apiNotFound,
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { deletePlanGroup, updatePlanGroup } from '@/services/plan.service';
import { GROUP_COLOR_KEYS } from '@/lib/shared/group-colors';

const UpdatePlanGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(60, 'name is too long').optional(),
    color: z.enum(GROUP_COLOR_KEYS).nullable().optional(),
    description: z.string().trim().max(300).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planGroupId: string }> }
) {
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

    const parsed = UpdatePlanGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { planGroupId } = await params;
    const { organizationId } = await resolveBoardActor(session.user);
    const planGroup = await updatePlanGroup(organizationId, planGroupId, parsed.data);

    return apiSuccess(planGroup, 'Group updated');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan group not found') return apiNotFound('Group not found');
      if (error.message === 'Duplicate entry') {
        return apiConflict('A group with this name already exists');
      }
    }
    console.error('[PATCH /api/plan-groups/[planGroupId]]', error);
    return apiInternalError();
  }
}

export async function DELETE(
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
    const { organizationId } = await resolveBoardActor(session.user);
    const result = await deletePlanGroup(organizationId, planGroupId);

    return apiSuccess(result, 'Group deleted');
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan group not found') {
      return apiNotFound('Group not found');
    }
    console.error('[DELETE /api/plan-groups/[planGroupId]]', error);
    return apiInternalError();
  }
}
