// hooks/useOrganizationMembers.ts
// Active members of the caller's organization (/api/board/members), for the
// assignee picker and the topbar avatars. Every page mounts it, so it is
// cached for the session and fetched once (see useApiResource).

'use client';

import { useApiResource } from '@/hooks/useApiResource';
import type { OrganizationMemberDto } from '@/types/planner';

export interface UseOrganizationMembersReturn {
  members: OrganizationMemberDto[];
  loading: boolean;
  error: string | null;
}

const NO_MEMBERS: OrganizationMemberDto[] = [];

export function useOrganizationMembers(): UseOrganizationMembersReturn {
  const { data, loading, error } = useApiResource<OrganizationMemberDto[]>('/api/board/members');
  return { members: data ?? NO_MEMBERS, loading, error };
}
