// hooks/useBoardGroups.ts
// Fetches the caller's organization columns (/api/board/groups) — a lightweight
// alternative to useBoard() for pages that only need the column list, not the
// full board with nested taskItems (e.g. the standalone TaskPage).

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GroupSummaryDto } from '@/types/planner';

export interface UseBoardGroupsReturn {
  groups: GroupSummaryDto[];
  loading: boolean;
  error: string | null;
}

export function useBoardGroups(): UseBoardGroupsReturn {
  const [groups, setGroups] = useState<GroupSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/board/groups', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load columns');
      }

      setGroups(data.data as GroupSummaryDto[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load columns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error };
}
