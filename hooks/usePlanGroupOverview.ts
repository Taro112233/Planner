// hooks/usePlanGroupOverview.ts
// Everything the group overview page shows, in one request. Cached per group
// for the session (see useApiResource), so switching back to a group is
// instant.

'use client';

import { useApiResource } from '@/hooks/useApiResource';
import type { PlanGroupOverviewDto } from '@/types/planner';

export interface UsePlanGroupOverviewReturn {
  overview: PlanGroupOverviewDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlanGroupOverview(planGroupId: string): UsePlanGroupOverviewReturn {
  const { data, loading, error, refetch } = useApiResource<PlanGroupOverviewDto>(
    `/api/plan-groups/${encodeURIComponent(planGroupId)}/overview`
  );
  return { overview: data, loading, error, refetch };
}
