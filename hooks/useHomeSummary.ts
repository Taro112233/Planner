// hooks/useHomeSummary.ts
// Counters, due-soon work and recent activity for the home page.

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HomeSummaryDto } from '@/types/planner';

export interface UseHomeSummaryReturn {
  data: HomeSummaryDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHomeSummary(): UseHomeSummaryReturn {
  const [data, setData] = useState<HomeSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/home', { credentials: 'include' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error ?? 'Failed to load home');
      setData(json.data as HomeSummaryDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
}
