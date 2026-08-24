// app/api/plans/route.ts
// Plans Controller — Layer 1 (HTTP only)
//
// GET  /api/plans[?planGroupId=…]  — plans with progress counters
// POST /api/plans                  — create a plan (with starter columns)
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createPlan, listPlans } from '@/services/plan.service';
import { GROUP_COLOR_KEYS } from '@/lib/shared/group-colors';

const CreatePlanSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(60, 'name is too long'),
  planGroupId: z.string().min(1).nullable().optional(),
  color: z.enum(GROUP_COLOR_KEYS).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);

    // Absent  → every plan. "none" → only plans outside any group.
    // Otherwise → that group's plans.
    const raw = new URL(request.url).searchParams.get('planGroupId');
    const planGroupId = raw === null ? undefined : raw === 'none' ? null : raw;

    const plans = await listPlans(organizationId, planGroupId);
    return apiSuccess(plans);
  } catch (error) {
    console.error('[GET /api/plans]', error);
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

    const parsed = CreatePlanSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const plan = await createPlan(organizationId, parsed.data.name, {
      planGroupId: parsed.data.planGroupId ?? null,
      color: parsed.data.color ?? null,
      actor,
    });

    return apiCreated(plan);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan group not found') return apiNotFound('Group not found');
      if (error.message === 'Duplicate entry') {
        return apiConflict('A plan with this name already exists');
      }
    }
    console.error('[POST /api/plans]', error);
    return apiInternalError();
  }
}
