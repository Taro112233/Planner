// app/api/board/tasks/[taskId]/subtasks/[subtaskId]/move/route.ts
// Subtask Reorder Controller — Layer 1 (HTTP only)
//
// PATCH — reposition a subtask among its siblings.
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
import { moveSubtask } from '@/services/board.service';

const MoveSubtaskSchema = z.object({
  targetIndex: z.number().int().min(0, 'targetIndex must be zero or greater'),
  /** Omit to keep the current parent; null moves the subtask to the root. */
  parentSubtaskId: z.string().min(1).nullable().optional(),
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = MoveSubtaskSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { taskId, subtaskId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await moveSubtask(
      organizationId,
      taskId,
      subtaskId,
      parsed.data.targetIndex,
      actor,
      parsed.data.parentSubtaskId
    );

    return apiSuccess(task, 'Subtask moved');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Subtask not found') return apiNotFound('Subtask not found');
      if (error.message === 'Parent subtask not found') {
        return apiNotFound('Parent subtask not found');
      }
      if (
        error.message === 'Cannot move a subtask into its own descendant' ||
        error.message === 'Maximum subtask depth exceeded'
      ) {
        return apiBadRequest(error.message);
      }
    }
    console.error('[PATCH /api/board/tasks/[taskId]/subtasks/[subtaskId]/move]', error);
    return apiInternalError();
  }
}
