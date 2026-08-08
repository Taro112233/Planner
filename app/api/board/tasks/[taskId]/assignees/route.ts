// app/api/board/tasks/[taskId]/assignees/route.ts
// Task Assignees Controller — Layer 1 (HTTP only)
//
// POST   /api/board/tasks/[taskId]/assignees — assign an org member to a task.
// DELETE /api/board/tasks/[taskId]/assignees — unassign an org member from a task.
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
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { assignTask, unassignTask } from '@/services/board.service';

const AssigneeSchema = z.object({
  organizationUserId: z.string().min(1, 'organizationUserId is required'),
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

    const parsed = AssigneeSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await assignTask(organizationId, taskId, parsed.data.organizationUserId, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Already assigned') return apiConflict('Member is already assigned to this task');
    }
    console.error('[POST /api/board/tasks/[taskId]/assignees]', error);
    return apiInternalError();
  }
}

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = AssigneeSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await unassignTask(organizationId, taskId, parsed.data.organizationUserId, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found') return apiNotFound('Task not found');
      if (error.message === 'Assignment not found') return apiNotFound('Assignment not found');
    }
    console.error('[DELETE /api/board/tasks/[taskId]/assignees]', error);
    return apiInternalError();
  }
}
