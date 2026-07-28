// hooks/useDataList.ts
// Generic paginated list hook.
//
// Eliminates the fetch/loading/error boilerplate that would otherwise be
// copy-pasted into every feature-specific list hook (e.g., useAdminUsers,
// useProjectList, useOrderList, etc.).
//
// Usage:
//   const { items, pagination, loading, error, setFilters, refetch } =
//     useDataList<User>('/api/admin/users', { page: 1, limit: 20 });

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PaginationMeta, PaginationParams } from '@/types/api';

export interface DataListFilters extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}

export interface UseDataListReturn<T> {
  items: T[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  filters: DataListFilters;
  setFilters: (updates: Partial<DataListFilters>) => void;
  refetch: () => Promise<void>;
}

/**
 * Generic paginated data-list hook.
 *
 * @param endpoint  API path (e.g., '/api/projects').
 * @param initial   Initial filter/pagination params.
 * @param itemsKey  Key in the response data object that contains the array.
 *                  Defaults to 'items'; use 'users' if your API returns `data.users`.
 */
export function useDataList<T>(
  endpoint: string,
  initial: DataListFilters = { page: 1, limit: 20 },
  itemsKey = 'items'
): UseDataListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, _setFilters] = useState<DataListFilters>(initial);

  // Stable ref to avoid stale closures in fetchData
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const setFilters = useCallback((updates: Partial<DataListFilters>) => {
    _setFilters((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 whenever a non-page filter changes
      page:
        updates.page ??
        (Object.keys(updates).some((k) => k !== 'page') ? 1 : prev.page),
    }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filtersRef.current).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `Request failed with status ${response.status}`);
      }

      if (data.success) {
        // Support both { data: { items, pagination } } and { data: { [itemsKey], pagination } }
        const payload = data.data;
        const resolvedItems: T[] = payload[itemsKey] ?? payload.items ?? [];
        const resolvedPagination: PaginationMeta = payload.pagination ?? null;

        setItems(resolvedItems);
        setPagination(resolvedPagination);
      } else {
        throw new Error(data.error ?? 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`[useDataList] ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, itemsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData, filters]); // re-fetch whenever filters change

  return { items, pagination, loading, error, filters, setFilters, refetch: fetchData };
}
