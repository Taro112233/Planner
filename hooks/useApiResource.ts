// hooks/useApiResource.ts
// Fetch one JSON resource from an `{ success, data }` endpoint. The single-
// object counterpart of useDataList: no pagination, no id in the path.
//
// Stale-while-revalidate: the last response for each endpoint is kept in
// memory for the session, so revisiting a page renders at once from that copy
// while a fresh request runs, and several components asking for the same
// endpoint at the same moment share one request.
//
// Usage:
//   const { data, loading, error, refetch } = useApiResource<ReportDto>('/api/reports');
//   useApiResource<T>(null) → idle (no request), for a not-yet-known endpoint.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseApiResourceReturn<T> {
  data: T | null;
  /** True only while there is nothing to show yet. */
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Replace the value (and the cached copy), e.g. after an optimistic mutation. */
  setData: (update: T | null | ((current: T | null) => T | null)) => void;
}

const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();
/** Mounted hooks, so an invalidation can refresh what is on screen now. */
const listeners = new Set<{ endpoint: string; refetch: () => void }>();

async function request<T>(endpoint: string): Promise<T> {
  const pending = inFlight.get(endpoint);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const response = await fetch(endpoint, { credentials: 'include' });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error ?? `Request failed with status ${response.status}`);
    }
    cache.set(endpoint, json.data);
    return json.data as T;
  })();

  inFlight.set(endpoint, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(endpoint);
  }
}

/**
 * Drop cached copies whose endpoint starts with `prefix` (all when omitted);
 * hooks currently showing one of them refetch it.
 */
export function invalidateApiResource(prefix = ''): void {
  [...cache.keys()].forEach((key) => {
    if (key.startsWith(prefix)) cache.delete(key);
  });
  listeners.forEach((listener) => {
    if (listener.endpoint.startsWith(prefix)) listener.refetch();
  });
}

export function useApiResource<T>(endpoint: string | null): UseApiResourceReturn<T> {
  const [data, setDataState] = useState<T | null>(() =>
    endpoint ? ((cache.get(endpoint) as T | undefined) ?? null) : null
  );
  const [loading, setLoading] = useState(() => Boolean(endpoint) && !cache.has(endpoint ?? ''));
  const [error, setError] = useState<string | null>(null);
  // Ignore a response for an endpoint we have since moved away from.
  const currentEndpoint = useRef(endpoint);
  currentEndpoint.current = endpoint;

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    try {
      setError(null);
      const fresh = await request<T>(endpoint);
      if (currentEndpoint.current === endpoint) setDataState(fresh);
    } catch (err) {
      if (currentEndpoint.current === endpoint) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (currentEndpoint.current === endpoint) setLoading(false);
    }
  }, [endpoint]);

  // On an endpoint change (e.g. a new scope), show its cached copy if any.
  useEffect(() => {
    if (!endpoint) {
      setDataState(null);
      setLoading(false);
      return;
    }
    const cached = cache.get(endpoint) as T | undefined;
    setDataState(cached ?? null);
    setLoading(cached === undefined);
    void fetchData();
  }, [endpoint, fetchData]);

  useEffect(() => {
    if (!endpoint) return;
    const listener = { endpoint, refetch: () => void fetchData() };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [endpoint, fetchData]);

  const setData = useCallback<UseApiResourceReturn<T>['setData']>(
    (update) => {
      setDataState((current) => {
        const next =
          typeof update === 'function'
            ? (update as (current: T | null) => T | null)(current)
            : update;
        if (endpoint) {
          if (next === null) cache.delete(endpoint);
          else cache.set(endpoint, next);
        }
        return next;
      });
    },
    [endpoint]
  );

  return { data, loading, error, refetch: fetchData, setData };
}
