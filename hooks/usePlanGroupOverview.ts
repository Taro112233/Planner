// hooks/usePlanGroupOverview.ts
// Everything the group overview page renders, in one request.

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlanGroupOverviewDto } from '@/types/planner';

export interface UsePlanGroupOverviewReturn {
  overview: PlanGroupOverviewDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlanGroupOverview(planGroupId: string): UsePlanGroupOverviewReturn {
  const [overview, setOverview] = useState<PlanGroupOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/plan-groups/${planGroupId}/overview`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load group');
      }
      setOverview(data.data as PlanGroupOverviewDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [planGroupId]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  return { overview, loading, error, refetch: fetchOverview };
}
