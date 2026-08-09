// app/api/board/tasks/[taskId]/route.ts
// Task Detail Controller — Layer 1 (HTTP only)
//
// GET /api/board/tasks/[taskId] — full task detail: description, subtask tree,
// assignees, badges, and recent activity — for the TaskDetailModal panel.
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
import { getTaskDetail } from '@/services/board.service';

export async function GET(
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

    const { organizationId } = await resolveBoardActor(session.user);
    const task = await getTaskDetail(organizationId, taskId);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[GET /api/board/tasks/[taskId]]', error);
    return apiInternalError();
  }
}
