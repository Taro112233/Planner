// hooks/useDataDetail.ts
// Generic single-record fetch hook.
//
// Usage:
//   const { data, loading, error, refetch } = useDataDetail<Project>('/api/projects', id);

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseDataDetailReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch a single resource by ID.
 *
 * @param endpoint  Base API path (e.g., '/api/projects').
 * @param id        Record ID. Hook is a no-op when id is null/undefined.
 */
export function useDataDetail<T>(
  endpoint: string,
  id: string | null | undefined
): UseDataDetailReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${endpoint}/${id}`, {
        credentials: 'include',
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? `Request failed with status ${response.status}`);
      }

      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error ?? 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`[useDataDetail] ${endpoint}/${id}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
