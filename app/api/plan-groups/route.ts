// app/api/plan-groups/route.ts
// Plan Groups Controller — Layer 1 (HTTP only)
//
// GET  /api/plan-groups — groups with their plan counts (sidebar badges)
// POST /api/plan-groups — create a group
//
// ⚠️ These are the mockup's "กลุ่ม" (folders of plans), NOT Kanban columns —
// those live under /api/board/groups.
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
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createPlanGroup, listPlanGroups } from '@/services/plan.service';
import { GROUP_COLOR_KEYS } from '@/lib/shared/group-colors';

const CreatePlanGroupSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(60, 'name is too long'),
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
    const planGroups = await listPlanGroups(organizationId);

    return apiSuccess(planGroups);
  } catch (error) {
    console.error('[GET /api/plan-groups]', error);
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

    const parsed = CreatePlanGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const planGroup = await createPlanGroup(
      organizationId,
      parsed.data.name,
      parsed.data.color ?? null,
      actor.organizationUserId
    );

    return apiCreated(planGroup);
  } catch (error) {
    if (error instanceof Error && error.message === 'Duplicate entry') {
      return apiConflict('A group with this name already exists');
    }
    console.error('[POST /api/plan-groups]', error);
    return apiInternalError();
  }
}
