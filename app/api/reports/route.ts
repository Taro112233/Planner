// app/api/reports/route.ts
// Reports Controller — Layer 1 (HTTP only)
//
// GET /api/reports?planGroupId= — workload, cards per column, top tickers, daily ticks.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { type NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  apiSuccess,
  apiUnauthorized,
  apiRateLimited,
  apiInternalError,
} from '@/lib/server/api-response';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { readPlanGroupScope } from '@/lib/server/scope-param';
import { getReport } from '@/services/report.service';

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const { organizationId } = await resolveBoardActor(session.user);
    return apiSuccess(await getReport(organizationId, new Date(), readPlanGroupScope(request)));
  } catch (error) {
    console.error('[GET /api/reports]', error);
    return apiInternalError();
  }
}
