// app/api/board/tasks/[taskId]/title/route.ts
// Task Title Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/title — inline-edit the task title (TaskPage).
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
import { updateTaskTitle } from '@/services/board.service';

const UpdateTitleSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
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

    const parsed = UpdateTitleSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await updateTaskTitle(organizationId, taskId, parsed.data.title, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/title]', error);
    return apiInternalError();
  }
}
