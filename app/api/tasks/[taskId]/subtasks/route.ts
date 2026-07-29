// app/api/tasks/[taskId]/subtasks/route.ts
// Subtask Toggle Controller — Layer 1 (HTTP only)
//
// PATCH /api/tasks/[taskId]/subtasks
//
// Responsibilities: Arcjet protection, Better Auth session, Zod validation,
//   delegate to service, map errors to HTTP responses.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
  apiZodError,
} from '@/lib/api-response';
import { toggleSubtask } from '@/services/task.service';

// ─────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────

const PatchSubtaskSchema = z.object({
  /** The unique ID of the subtask to toggle */
  subtaskId: z.string().min(1, 'subtaskId is required'),
  /**
   * Organization ID — the client must supply this so we can enforce
   * tenant isolation without an extra DB lookup in the controller.
   */
  organizationId: z.string().min(1, 'organizationId is required'),
});

// ─────────────────────────────────────────────
// PATCH /api/tasks/[taskId]/subtasks
// ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // ── 1. Arcjet protection (rate limit + bot detection + shield) ─────
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) {
      return apiRateLimited(arcjetError.error);
    }

    // ── 2. Better Auth session ─────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return apiUnauthorized();
    }

    // ── 3. Resolve route param ─────────────────────────────────────────
    const { taskId } = await params;
    if (!taskId) {
      return apiBadRequest('taskId path parameter is required');
    }

    // ── 4. Zod body validation ─────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = PatchSubtaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiZodError(parsed.error);
    }

    const { subtaskId, organizationId } = parsed.data;
    const userId = session.user.id;

    // ── 5. Delegate to service ─────────────────────────────────────────
    const updatedTask = await toggleSubtask(
      taskId,
      subtaskId,
      userId,
      organizationId
    );

    return apiSuccess(updatedTask, 'Subtask updated successfully');
  } catch (error) {
    // ── 6. Map service errors to HTTP responses ────────────────────────
    if (error instanceof Error) {
      const message = error.message;

      if (message === 'Task not found') {
        return apiNotFound('Task not found');
      }

      if (message === 'Subtask not found') {
        return apiNotFound('Subtask not found in this task');
      }
    }

    console.error('[PATCH /api/tasks/[taskId]/subtasks]', error);
    return apiInternalError();
  }
}
