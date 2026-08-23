// app/api/board/route.ts
// Board Controller — Layer 1 (HTTP only)
//
// GET /api/board — resolves the session user's default organization
// (auto-provisioning it on first visit) and returns its columns + cards.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import { apiSuccess, apiUnauthorized, apiRateLimited, apiInternalError } from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { getBoard } from '@/services/board.service';
import { getOrCreateDefaultPlan } from '@/services/plan.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    // No planId in the URL yet — the board is whichever plan the organization
    // resolves to by default (and gets provisioned on first use).
    const plan = await getOrCreateDefaultPlan(organizationId);
    const board = await getBoard(organizationId, plan.id);

    return apiSuccess(board);
  } catch (error) {
    console.error('[GET /api/board]', error);
    return apiInternalError();
  }
}
