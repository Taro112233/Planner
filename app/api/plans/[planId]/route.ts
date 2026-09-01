// app/api/plans/[planId]/route.ts
// Plan Controller — Layer 1 (HTTP only)
//
// PATCH  /api/plans/[planId] — rename, recolor, or join/leave a group
// DELETE /api/plans/[planId] — soft delete
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
import { deletePlan, updatePlan } from '@/services/plan.service';
import { GROUP_COLOR_KEYS } from '@/lib/shared/group-colors';

const UpdatePlanSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(60, 'name is too long').optional(),
    color: z.enum(GROUP_COLOR_KEYS).nullable().optional(),
    /** null detaches the plan from its group. */
    planGroupId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
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

    const parsed = UpdatePlanSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { planId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const plan = await updatePlan(organizationId, planId, parsed.data, actor);

    return apiSuccess(plan, 'Plan updated');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan not found') return apiNotFound('Plan not found');
      if (error.message === 'Plan group not found') return apiNotFound('Group not found');
      if (error.message === 'Duplicate entry') {
        return apiConflict('A plan with this name already exists');
      }
    }
    console.error('[PATCH /api/plans/[planId]]', error);
    return apiInternalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { planId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const result = await deletePlan(organizationId, planId, actor);

    return apiSuccess(result, 'Plan deleted');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan not found') return apiNotFound('Plan not found');
      // A state conflict, not malformed input.
      if (error.message === 'Cannot delete the last plan') {
        return apiConflict('A workspace must keep at least one plan');
      }
    }
    console.error('[DELETE /api/plans/[planId]]', error);
    return apiInternalError();
  }
}
