// app/api/task-templates/[templateId]/route.ts
// Task Template Controller — Layer 1 (HTTP only)
//
// DELETE /api/task-templates/[templateId] — remove a saved shape
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiNotFound,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { deleteTaskTemplate } from '@/services/task-template.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { templateId } = await params;
    const { organizationId } = await resolveBoardActor(session.user);
    const result = await deleteTaskTemplate(organizationId, templateId);

    return apiSuccess(result, 'Template deleted');
  } catch (error) {
    if (error instanceof Error && error.message === 'Template not found') {
      return apiNotFound('ไม่พบเทมเพลตนี้');
    }
    console.error('[DELETE /api/task-templates/[templateId]]', error);
    return apiInternalError();
  }
}
