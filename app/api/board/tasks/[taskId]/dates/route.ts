// app/api/board/tasks/[taskId]/dates/route.ts
// Task Dates Controller — Layer 1 (HTTP only)
//
// PATCH /api/board/tasks/[taskId]/dates — set start/due date (TaskPage).
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
import { updateTaskDates } from '@/services/board.service';

const UpdateDatesSchema = z
  .object({
    startDate: z.string().datetime().nullable(),
    dueDate: z.string().datetime().nullable(),
  })
  .refine(
    (data) => !data.startDate || !data.dueDate || new Date(data.dueDate) >= new Date(data.startDate),
    { message: 'dueDate must be on or after startDate', path: ['dueDate'] }
  );

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

    const parsed = UpdateDatesSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const task = await updateTaskDates(organizationId, taskId, parsed.data, actor);

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return apiNotFound('Task not found');
    }
    console.error('[PATCH /api/board/tasks/[taskId]/dates]', error);
    return apiInternalError();
  }
}
