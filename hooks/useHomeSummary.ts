// hooks/useHomeSummary.ts
// Counters, due-soon work and recent activity for the home page. Cached for
// the session (see useApiResource), so returning home is instant.

'use client';

import { useApiResource } from '@/hooks/useApiResource';
import type { HomeSummaryDto } from '@/types/planner';

export interface UseHomeSummaryReturn {
  data: HomeSummaryDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHomeSummary(): UseHomeSummaryReturn {
  const { data, loading, error, refetch } = useApiResource<HomeSummaryDto>('/api/home');
  return { data, loading, error, refetch };
}
