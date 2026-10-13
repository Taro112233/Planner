// app/api/search/route.ts
// Search Controller — Layer 1 (HTTP only)
//
// GET /api/search?q= — cards (and cards with a matching subtask) in the
// caller's workspace.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { searchTasks } from '@/services/search.service';

const QuerySchema = z.object({ q: z.string().trim().min(1).max(100) });

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const parsed = QuerySchema.safeParse({ q: request.nextUrl.searchParams.get('q') ?? '' });
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId } = await resolveBoardActor(session.user);
    return apiSuccess(await searchTasks(organizationId, parsed.data.q));
  } catch (error) {
    console.error('[GET /api/search]', error);
    return apiInternalError();
  }
}
