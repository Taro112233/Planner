// lib/server/scope-param.ts
// Reads the optional `?planGroupId=` that scope-aware endpoints (reports,
// audit, trash, members) accept — the group the user is working in. Anything
// that is not a plausible id is ignored rather than rejected: the services
// scope every query by organizationId, so the worst case is an empty result.

import type { NextRequest } from 'next/server';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function readPlanGroupScope(request: NextRequest): string | undefined {
  const value = request.nextUrl.searchParams.get('planGroupId');
  return value && ID_PATTERN.test(value) ? value : undefined;
}
