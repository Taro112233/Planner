// app/api/board/tasks/[taskId]/subtasks/[subtaskId]/rename/route.ts
// Subtask Rename Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/subtasks/[subtaskId]/rename — change a
// subtask's title (TaskPage). Kept as its own sub-route so the sibling
// PATCH .../subtasks/[subtaskId] (no-body toggle) contract is untouched.
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
import { renameSubtask } from '@/services/board.service';

const RenameSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { taskId, subtaskId } = await params;
    if (!taskId || !subtaskId) {
      return apiBadRequest('taskId and subtaskId path parameters are required');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = RenameSubtaskSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await renameSubtask(organizationId, taskId, subtaskId, parsed.data.title, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Subtask not found') return apiNotFound('Subtask not found in this task');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/subtasks/[subtaskId]/rename]', error);
    return apiInternalError();
  }
}
