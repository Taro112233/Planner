// app/api/board/tasks/[taskId]/subtasks/route.ts
// Task Subtasks Controller — Layer 1 (HTTP only)
//
// POST /api/board/tasks/[taskId]/subtasks — add a root-level subtask.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiCreated,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { addSubtask } from '@/services/board.service';

const AddSubtaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
  parentSubtaskId: z.string().trim().min(1).optional(),
});

export async function POST(
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

    const parsed = AddSubtaskSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await addSubtask(
      organizationId,
      taskId,
      parsed.data.title,
      actor,
      parsed.data.parentSubtaskId
    );

    return apiCreated(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Parent subtask not found') return apiNotFound('Parent subtask not found');
      if (error.message === 'Maximum subtask depth exceeded') {
        return apiBadRequest('Maximum subtask depth exceeded');
      }
    }
    console.error('[POST /api/board/tasks/[taskId]/subtasks]', error);
    return apiInternalError();
  }
}
