// app/api/audit/route.ts
// Audit Log Controller — Layer 1 (HTTP only)
//
// GET /api/audit?category=&actorId=&planGroupId=&page=&limit= — paginated log
// GET /api/audit?format=csv&…                                  — same filter as CSV
// Owners and admins only.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/server/auth';
import { arcjetAPI, handleArcjetDecision } from '@/lib/server/arcjet-config';
import {
  paginatedSuccess,
  apiUnauthorized,
  apiForbidden,
  apiRateLimited,
  apiZodError,
  apiInternalError,
} from '@/lib/server/api-response';
import { parsePaginationParams } from '@/lib/server/pagination';
import { resolveBoardActor } from '@/lib/server/board-actor';
import { readPlanGroupScope } from '@/lib/server/scope-param';
import {
  AUDIT_FORBIDDEN,
  assertCanViewAuditLog,
  exportAuditLogCsv,
  listAuditLog,
} from '@/services/audit.service';

const AuditQuerySchema = z.object({
  category: z.enum(['all', 'tick', 'move', 'columns', 'tasks', 'plans']).optional(),
  actorId: z.string().min(1).max(64).optional(),
  format: z.enum(['json', 'csv']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const decision = await arcjetAPI.protect(request, { requested: 1 });
    const arcjetError = handleArcjetDecision(decision);
    if (arcjetError) return apiRateLimited(arcjetError.error);

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const url = new URL(request.url);
    const parsed = AuditQuerySchema.safeParse({
      category: url.searchParams.get('category') ?? undefined,
      actorId: url.searchParams.get('actorId') ?? undefined,
      format: url.searchParams.get('format') ?? undefined,
    });
    if (!parsed.success) return apiZodError(parsed.error);

    const { organizationId, actor } = await resolveBoardActor(session.user);
    assertCanViewAuditLog(actor.role);

    const filter = {
      category: parsed.data.category,
      actorId: parsed.data.actorId,
      planGroupId: readPlanGroupScope(request),
    };

    if (parsed.data.format === 'csv') {
      const csv = await exportAuditLogCsv(organizationId, filter);
      const stamp = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-log-${stamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const { page, limit, skip } = parsePaginationParams(url);
    const { items, total } = await listAuditLog(organizationId, filter, { skip, take: limit });
    return paginatedSuccess(items, { page, limit, total });
  } catch (error) {
    if (error instanceof Error && error.message === AUDIT_FORBIDDEN) {
      return apiForbidden(AUDIT_FORBIDDEN);
    }
    console.error('[GET /api/audit]', error);
    return apiInternalError();
  }
}
