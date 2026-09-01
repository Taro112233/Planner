// app/api/board/route.ts
// Board Controller — Layer 1 (HTTP only)
//
// GET /api/board[?planId=…] — resolves the session user's organization and the
// plan to show (auto-provisioning both on first visit), then returns that
// plan's columns + cards.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { getBoard } from '@/services/board.service';
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

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    const planId = await resolvePlanId(request, organizationId);
    const board = await getBoard(organizationId, planId);

    return apiSuccess(board);
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan not found') {
      return apiNotFound('Plan not found');
    }
    console.error('[GET /api/board]', error);
    return apiInternalError();
  }
}
