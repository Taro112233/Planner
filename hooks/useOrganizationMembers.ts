// hooks/useOrganizationMembers.ts
// Fetches the active members of the caller's organization (/api/board/members).
// Used by the task detail panel's assignee picker.

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrganizationMemberDto } from '@/types/planner';

export interface UseOrganizationMembersReturn {
  members: OrganizationMemberDto[];
  loading: boolean;
  error: string | null;
}

export function useOrganizationMembers(): UseOrganizationMembersReturn {
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/board/members', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load members');
      }

      setMembers(data.data as OrganizationMemberDto[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error };
}
