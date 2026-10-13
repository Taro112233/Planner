// components/MembersPage/types.ts

import type { WorkspaceMemberDto } from '@/types/planner';
import type { WorkspaceRole } from '@/lib/shared/member-roles';

/** GET /api/members */
export interface MembersPayload {
  members: WorkspaceMemberDto[];
  viewer: { organizationUserId: string; role: WorkspaceRole };
}
