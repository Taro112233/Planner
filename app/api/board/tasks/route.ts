// app/api/board/tasks/route.ts
// Board Tasks Controller — Layer 1 (HTTP only)
//
// POST /api/board/tasks — quick-add a card to a column.
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
  apiNotFound,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createTask } from '@/services/board.service';

const CreateTaskSchema = z.object({
  groupId: z.string().min(1, 'groupId is required'),
  title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
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

    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await createTask(organizationId, parsed.data.groupId, parsed.data.title, actor);

    return apiCreated(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Group not found') {
      return apiNotFound('Group not found');
    }
    console.error('[POST /api/board/tasks]', error);
    return apiInternalError();
  }
}
