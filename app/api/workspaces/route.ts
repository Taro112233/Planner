// app/api/workspaces/route.ts
// Workspaces Controller — Layer 1 (HTTP only)
//
// GET /api/workspaces — every organization the caller can act in.
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
import { listUserWorkspaces } from '@/services/organization.service';
import { resolveBoardActor } from '@/lib/server/board-actor';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    // Resolving the actor first guarantees the user's own workspace exists,
    // so a brand-new account never sees an empty switcher.
    const { organizationId } = await resolveBoardActor(session.user);
    const workspaces = await listUserWorkspaces(session.user.id);

    return apiSuccess({ workspaces, activeOrganizationId: organizationId });
  } catch (error) {
    console.error('[GET /api/workspaces]', error);
    return apiInternalError();
  }
}
