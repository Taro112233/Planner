// hooks/useMyTasks.ts
// Cross-plan list of the caller's unfinished work ("งานของฉัน").

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MyTasksDto } from '@/types/planner';

export interface UseMyTasksReturn {
  data: MyTasksDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyTasks(): UseMyTasksReturn {
  const [data, setData] = useState<MyTasksDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/my-tasks', { credentials: 'include' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error ?? 'Failed to load tasks');
      setData(json.data as MyTasksDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return { data, loading, error, refetch: fetchTasks };
}
