// hooks/useMutation.ts
// Generic create / update / delete hook.
//
// Handles loading state, error state, and optimistic feedback so
// feature-specific code only needs to define the API call itself.
//
// Usage:
//   const { mutate, loading, error } = useMutation();
//   const ok = await mutate('/api/projects', { method: 'POST', body: data });

'use client';

import { useState, useCallback } from 'react';

export interface MutationOptions<TBody = unknown> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: Record<string, string>;
}

export interface UseMutationReturn<TResponse = unknown> {
  mutate: <TBody = unknown>(
    endpoint: string,
    options?: MutationOptions<TBody>
  ) => Promise<TResponse | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Generic mutation hook.
 * Returns null on error; throws only if `throwOnError` is true.
 */
export function useMutation<TResponse = unknown>(
  throwOnError = false
): UseMutationReturn<TResponse> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const mutate = useCallback(
    async <TBody = unknown>(
      endpoint: string,
      options: MutationOptions<TBody> = {}
    ): Promise<TResponse | null> => {
      const { method = 'POST', body, headers = {} } = options;

      try {
        setLoading(true);
        setError(null);

        const fetchOptions: RequestInit = {
          method,
          credentials: 'include',
          headers: {
            ...(body !== undefined && { 'Content-Type': 'application/json' }),
            ...headers,
          },
          ...(body !== undefined && { body: JSON.stringify(body) }),
        };

        const response = await fetch(endpoint, fetchOptions);

        // Handle 204 No Content
        if (response.status === 204) {
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? `Request failed with status ${response.status}`);
        }

        if (data.success === false) {
          throw new Error(data.error ?? 'Mutation failed');
        }

        return data.data as TResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        console.error(`[useMutation] ${method} ${endpoint}:`, err);

        if (throwOnError) throw err;
        return null;
      } finally {
        setLoading(false);
      }
    },
    [throwOnError]
  );

  return { mutate, loading, error, reset };
}
