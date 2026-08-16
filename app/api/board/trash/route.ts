// app/api/board/trash/route.ts
// Trash List Controller — Layer 1 (HTTP only)
//
// GET /api/board/trash — every soft-deleted task in the organization, most
// recently deleted first.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import { apiSuccess, apiUnauthorized, apiRateLimited, apiInternalError } from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { listTrashedTasks } from '@/services/board.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    const tasks = await listTrashedTasks(organizationId);

    return apiSuccess(tasks);
  } catch (error) {
    console.error('[GET /api/board/trash]', error);
    return apiInternalError();
  }
}
