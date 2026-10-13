// app/api/inbox/route.ts
// Inbox Controller — Layer 1 (HTTP only)
//
// GET /api/inbox — others' activity on cards assigned to the caller.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { listInbox } from '@/services/inbox.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId, actor } = await resolveBoardActor(session.user);
    return apiSuccess(await listInbox(organizationId, actor.organizationUserId));
  } catch (error) {
    console.error('[GET /api/inbox]', error);
    return apiInternalError();
  }
}
