// app/api/plan-groups/join/route.ts
// Join-by-code Controller — Layer 1 (HTTP only)
//
// POST /api/plan-groups/join — redeem an invite code.
//
// Deliberately does NOT resolve the caller's own organization: the code
// identifies which workspace they are joining, and resolveBoardActor would
// provision an unrelated one.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAuth, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { joinPlanGroupByCode } from '@/services/plan.service';

const JoinSchema = z.object({
  code: z.string().trim().min(4, 'code is required').max(32),
});

export async function POST(request: NextRequest) {
  try {
    // The stricter bucket: this endpoint is guessable by design, so it is rate
    // limited like an auth attempt rather than a normal read.
    const decision = await arcjetAuth.protect(request);
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

    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const result = await joinPlanGroupByCode(
      session.user.id,
      session.user.name || session.user.id,
      parsed.data.code
    );

    return apiSuccess(result, result.alreadyMember ? 'Already a member' : 'Joined');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid join code') return apiNotFound('รหัสเข้ากลุ่มไม่ถูกต้อง');
      if (error.message === 'This group is not accepting new members') {
        return apiForbidden('กลุ่มนี้ปิดรับสมาชิกอยู่');
      }
    }
    console.error('[POST /api/plan-groups/join]', error);
    return apiInternalError();
  }
}
