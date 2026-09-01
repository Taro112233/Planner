// app/api/task-templates/route.ts
// Task Templates Controller — Layer 1 (HTTP only)
//
// GET  /api/task-templates — saved task shapes for the picker
// POST /api/task-templates — save a new one
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiZodError,
  apiConflict,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { createTaskTemplate, listTaskTemplates } from '@/services/task-template.service';

// Depth 0..2, mirroring the Subtask tree's limit. Zod cannot express a
// recursive literal, so the nesting is spelled out.
const LeafSchema = z.object({ title: z.string().trim().min(1).max(200) });
const ChildSchema = LeafSchema.extend({ children: z.array(LeafSchema).max(50).optional() });
const RootSchema = LeafSchema.extend({ children: z.array(ChildSchema).max(50).optional() });

const CreateTemplateSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(60),
  title: z.string().trim().min(1, 'title is required').max(200),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  subtasks: z.array(RootSchema).max(50).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    return apiSuccess(await listTaskTemplates(organizationId));
  } catch (error) {
    console.error('[GET /api/task-templates]', error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
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

    const parsed = CreateTemplateSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    const template = await createTaskTemplate(
      organizationId,
      {
        name: parsed.data.name,
        title: parsed.data.title,
        priority: parsed.data.priority,
        subtasks: (parsed.data.subtasks ?? []).map((root) => ({
          title: root.title,
          children: (root.children ?? []).map((child) => ({
            title: child.title,
            children: (child.children ?? []).map((leaf) => ({ title: leaf.title, children: [] })),
          })),
        })),
      },
      actor.organizationUserId
    );

    return apiCreated(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'Duplicate entry') {
      return apiConflict('มีเทมเพลตชื่อนี้อยู่แล้ว');
    }
    console.error('[POST /api/task-templates]', error);
    return apiInternalError();
  }
}
