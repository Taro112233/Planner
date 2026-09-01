// app/api/board/tasks/[taskId]/restore/route.ts
// Task Restore Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/restore — restore a task out of the trash.
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
import { restoreTask } from '@/services/board.service';

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

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await restoreTask(organizationId, taskId, actor);

    return apiSuccess(task, 'Task restored');
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/restore]', error);
    return apiInternalError();
  }
}
