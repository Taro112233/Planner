// app/api/workspaces/active/route.ts
// Active Workspace Controller — Layer 1 (HTTP only)
//
// POST /api/workspaces/active — switch which workspace the caller acts in.
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
  apiForbidden,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { listUserWorkspaces } from '@/services/organization.service';
import { ACTIVE_ORG_COOKIE } from '@/lib/server/board-actor';

const SwitchSchema = z.object({
  organizationId: z.string().min(1, 'organizationId is required'),
});

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

    const parsed = SwitchSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    // Membership is checked here rather than trusted from the cookie later:
    // this endpoint is the only place the value can be set.
    const workspaces = await listUserWorkspaces(session.user.id);
    const target = workspaces.find(
      (workspace) => workspace.organizationId === parsed.data.organizationId
    );
    if (!target) return apiForbidden('คุณไม่ได้เป็นสมาชิกของเวิร์กสเปซนี้');

    const response = apiSuccess(target, 'Workspace switched');
    response.cookies.set({
      name: ACTIVE_ORG_COOKIE,
      value: target.organizationId,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error('[POST /api/workspaces/active]', error);
    return apiInternalError();
  }
}
