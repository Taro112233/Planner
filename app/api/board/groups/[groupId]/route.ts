// app/api/board/groups/[groupId]/route.ts
// Board Group Controller — Layer 1 (HTTP only)
//
// PATCH  /api/board/groups/[groupId] — rename / recolor / set a WIP limit
// DELETE /api/board/groups/[groupId] — relocate the cards, then drop the column
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
import { deleteGroup, updateGroup } from '@/services/board.service';
import { GROUP_COLOR_KEYS } from '@/lib/shared/group-colors';

const UpdateGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(60, 'name is too long').optional(),
    // null clears the color; an omitted key leaves it untouched.
    color: z.enum(GROUP_COLOR_KEYS).nullable().optional(),
    wipLimit: z
      .number()
      .int('wipLimit must be a whole number')
      .min(1, 'wipLimit must be at least 1')
      .max(999, 'wipLimit is too large')
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const DeleteGroupSchema = z.object({
  targetGroupId: z.string().min(1, 'targetGroupId is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const parsed = UpdateGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { groupId } = await params;
    const { organizationId } = await resolveBoardActor(session.user);
    const group = await updateGroup(organizationId, groupId, parsed.data);

    return apiSuccess(group, 'Column updated');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Group not found') return apiNotFound('Column not found');
      if (error.message === 'Duplicate entry') {
        return apiConflict('A column with this name already exists');
      }
    }
    console.error('[PATCH /api/board/groups/[groupId]]', error);
    return apiInternalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    // A body on DELETE matches the existing convention in
    // app/api/board/tasks/[taskId]/assignees/route.ts.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest('Request body must be valid JSON');
    }

    const parsed = DeleteGroupSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { groupId } = await params;
    const { organizationId, actor } = await resolveBoardActor(session.user);
    const result = await deleteGroup(organizationId, groupId, parsed.data.targetGroupId, actor);

    return apiSuccess(result, 'Column deleted');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Group not found') return apiNotFound('Column not found');
      if (error.message === 'Target group not found') {
        return apiNotFound('Target column not found');
      }
      if (error.message === 'Target column must be different') {
        return apiBadRequest('Pick a different column to move the cards into');
      }
      // A state conflict, not malformed input.
      if (error.message === 'Cannot delete the last column') {
        return apiConflict('A board must keep at least one column');
      }
    }
    console.error('[DELETE /api/board/groups/[groupId]]', error);
    return apiInternalError();
  }
}
