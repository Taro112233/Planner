// app/api/board/tasks/[taskId]/description/route.ts
// Task Description Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/description — save the task description (TaskPage).
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
  apiNotFound,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { updateTaskDescription } from '@/services/board.service';

const UpdateDescriptionSchema = z.object({
  description: z.string().trim().max(5000, 'description is too long').nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { taskId } = await params;
    if (!taskId) return apiBadRequest('taskId path parameter is required');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = UpdateDescriptionSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const description = parsed.data.description === '' ? null : parsed.data.description;
    const task = await updateTaskDescription(organizationId, taskId, description, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/description]', error);
    return apiInternalError();
  }
}
