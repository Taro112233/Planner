// app/api/board/tasks/[taskId]/permanent/route.ts
// Task Permanent-Delete Controller — Layer 1 (HTTP only)
//
// DELETE /api/board/tasks/[taskId]/permanent — permanently delete a task
// that is already in the trash. Irreversible.
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
import { permanentlyDeleteTask } from '@/services/board.service';

export async function DELETE(
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
    const result = await permanentlyDeleteTask(organizationId, taskId, actor);

    return apiSuccess(result, 'Task permanently deleted');
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[DELETE /api/board/tasks/[taskId]/permanent]', error);
    return apiInternalError();
  }
}
