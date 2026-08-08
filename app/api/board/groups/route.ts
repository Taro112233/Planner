// app/api/board/groups/route.ts
// Board Groups Controller — Layer 1 (HTTP only)
//
// POST /api/board/groups — add a new Kanban column to the caller's organization.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiCreated,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createGroup } from '@/services/board.service';

const CreateGroupSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(60, 'name is too long'),
  color: z.string().trim().min(1).max(20).optional(),
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

    const parsed = CreateGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId } = await resolveBoardActor(session.user);
    const group = await createGroup(organizationId, parsed.data.name, parsed.data.color ?? null);

    return apiCreated(group);
  } catch (error) {
    if (error instanceof Error && error.message === 'Duplicate entry') {
      return apiConflict('A column with this name already exists');
    }
    console.error('[POST /api/board/groups]', error);
    return apiInternalError();
  }
}
