// app/api/plan-groups/[planGroupId]/join-code/route.ts
// Join Code Controller — Layer 1 (HTTP only)
//
// POST  /api/plan-groups/[planGroupId]/join-code — generate (or re-issue) the code
// PATCH /api/plan-groups/[planGroupId]/join-code — open/close joining
// Owner-only; the service enforces that.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { regenerateJoinCode, setJoinCodeEnabled } from '@/services/plan.service';

const ToggleSchema = z.object({ enabled: z.boolean() });

export async function POST(
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
    const settings = await regenerateJoinCode(
      organizationId,
      planGroupId,
      actor.organizationUserId
    );

    return apiSuccess(settings, 'Join code generated');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan group not found') return apiNotFound('Group not found');
      if (error.message === 'Only the group owner can manage the join code') {
        return apiForbidden(error.message);
      }
    }
    console.error('[POST /api/plan-groups/[planGroupId]/join-code]', error);
    return apiInternalError();
  }
}

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

    const parsed = ToggleSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { planGroupId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const settings = await setJoinCodeEnabled(
      organizationId,
      planGroupId,
      actor.organizationUserId,
      parsed.data.enabled
    );

    return apiSuccess(settings, parsed.data.enabled ? 'Joining opened' : 'Joining closed');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan group not found') return apiNotFound('Group not found');
      if (error.message === 'Only the group owner can manage the join code') {
        return apiForbidden(error.message);
      }
      if (error.message === 'Generate a join code first') return apiBadRequest(error.message);
    }
    console.error('[PATCH /api/plan-groups/[planGroupId]/join-code]', error);
    return apiInternalError();
  }
}
