// app/api/board/tasks/[taskId]/subtasks/[subtaskId]/route.ts
// Subtask Toggle Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/subtasks/[subtaskId] — flip a subtask's
// isDone state. Replaces the old (schema-mismatched) /api/tasks/[taskId]/subtasks
// route — organizationId is now resolved server-side instead of trusted from
// the request body.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { toggleSubtask, deleteSubtask } from '@/services/board.service';

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

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await toggleSubtask(organizationId, taskId, subtaskId, actor);

    return apiSuccess(task, 'Subtask updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Subtask not found') {
        return apiNotFound('Subtask not found in this task');
      }
    }
    console.error('[PATCH /api/board/tasks/[taskId]/subtasks/[subtaskId]]', error);
    return apiInternalError();
  }
}

// DELETE /api/board/tasks/[taskId]/subtasks/[subtaskId] — remove a subtask
// (and its descendants, via DB cascade). Used by TaskPage's per-row action menu.
export async function DELETE(
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

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await deleteSubtask(organizationId, taskId, subtaskId, actor);

    return apiSuccess(task, 'Subtask deleted successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Subtask not found') {
        return apiNotFound('Subtask not found in this task');
      }
    }
    console.error('[DELETE /api/board/tasks/[taskId]/subtasks/[subtaskId]]', error);
    return apiInternalError();
  }
}
