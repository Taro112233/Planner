// app/api/board/tasks/[taskId]/activity/route.ts
// Task Activity Controller — Layer 1 (HTTP only)
//
// GET /api/board/tasks/[taskId]/activity — full paginated activity history
// (the slide-over only shows the latest 10 via getTaskDetail; TaskPage paginates
// through everything).
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  paginatedSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from '@/lib/server/api-response';
import { parsePaginationParams } from '@/lib/server/pagination';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { listTaskActivity } from '@/services/board.service';

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

    const { page, limit, skip } = parsePaginationParams(new URL(request.url));
    const { organizationId } = await resolveBoardActor(session.user);
    const { items, total } = await listTaskActivity(organizationId, taskId, { skip, take: limit });

    return paginatedSuccess(items, { page, limit, total });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[GET /api/board/tasks/[taskId]/activity]', error);
    return apiInternalError();
  }
}
