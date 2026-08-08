// app/api/board/tasks/[taskId]/move/route.ts
// Task Move Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/move — drag-and-drop reorder/move between columns.
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
import { moveTask } from '@/services/board.service';

const MoveTaskSchema = z.object({
  groupId: z.string().min(1, 'groupId is required'),
  targetIndex: z.number().int().min(0, 'targetIndex must be >= 0'),
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

    const parsed = MoveTaskSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await moveTask(
      organizationId,
      taskId,
      parsed.data.groupId,
      parsed.data.targetIndex,
      actor
    );

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Group not found') return apiNotFound('Group not found');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/move]', error);
    return apiInternalError();
  }
}
