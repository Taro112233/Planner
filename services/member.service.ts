// services/member.service.ts
// Member Service — Layer 2 (Business Logic + Database)
// Backs "สมาชิก & สิทธิ์": the workspace roster with each member's open
// workload, and changing a member's workspace role.
//
// Role rules live in lib/shared/member-roles.ts; on top of them, nobody
// changes their own role.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { OrganizationRole } from '@prisma/client';
import type { WorkspaceMemberDto } from '@/types/planner';
import { canChangeMemberRole, type AssignableRole } from '@/lib/shared/member-roles';

export const MEMBER_NOT_FOUND = 'Member not found';
export const CANNOT_MANAGE_MEMBER = 'Cannot manage a user with equal or higher role';

export { canChangeMemberRole };

/**
 * Active members with how many unfinished cards each one holds. With a
 * `planGroupId`, only that group's members, counting only its plans' cards.
 */
export async function listWorkspaceMembers(
  organizationId: string,
  planGroupId?: string
): Promise<WorkspaceMemberDto[]> {
  const [members, plans] = await Promise.all([
    prisma.organizationUser.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(planGroupId ? { planGroupMembers: { some: { planGroupId } } } : {}),
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        joinedAt: true,
        user: { select: { image: true, email: true } },
        planGroupMembers: planGroupId
          ? { where: { planGroupId }, select: { role: true } }
          : false,
        taskAssignments: {
          where: {
            taskItem: {
              deletedAt: null,
              ...(planGroupId ? { group: { plan: { planGroupId } } } : {}),
            },
          },
          select: { taskItem: { select: { groupId: true } } },
        },
      },
    }),
    prisma.plan.findMany({
      where: { organizationId, deletedAt: null, ...(planGroupId ? { planGroupId } : {}) },
      select: { groups: { orderBy: { sortOrder: 'asc' }, select: { id: true } } },
    }),
  ]);

  // Done = last column of its plan, the rule every other count uses.
  const doneGroupIds = new Set(
    plans.flatMap((plan) => (plan.groups.length ? [plan.groups[plan.groups.length - 1].id] : []))
  );

  return members.map((member) => ({
    organizationUserId: member.id,
    name: `${member.firstName} ${member.lastName}`.trim(),
    avatarUrl: member.user.image ?? null,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    groupRole: member.planGroupMembers?.[0]?.role ?? null,
    openTaskCount: member.taskAssignments.filter(
      (assignment) => !doneGroupIds.has(assignment.taskItem.groupId)
    ).length,
  }));
}

/**
 * @throws Error(MEMBER_NOT_FOUND)
 * @throws Error(CANNOT_MANAGE_MEMBER)
 */
export async function updateMemberRole(
  organizationId: string,
  actor: { organizationUserId: string; role: OrganizationRole },
  targetId: string,
  nextRole: AssignableRole
): Promise<WorkspaceMemberDto['role']> {
  if (targetId === actor.organizationUserId) throw new Error(CANNOT_MANAGE_MEMBER);

  const target = await prisma.organizationUser.findFirst({
    where: { id: targetId, organizationId, status: 'ACTIVE' },
    select: { id: true, role: true },
  });
  if (!target) throw new Error(MEMBER_NOT_FOUND);
  if (!canChangeMemberRole(actor.role, target.role, nextRole)) {
    throw new Error(CANNOT_MANAGE_MEMBER);
  }
  if (target.role === nextRole) return nextRole;

  const updated = await prisma.organizationUser.update({
    where: { id: target.id },
    data: { role: nextRole },
    select: { role: true },
  });
  return updated.role;
}
