// services/organization.service.ts
// Organization Service — Layer 2 (Business Logic + Database)
// Covers: resolving (or lazily provisioning) the single default organization
// a user acts in for the v1 Kanban board — no org-switcher UI exists yet.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/server/prisma';
import type { OrganizationRole } from '@prisma/client';
import type { OrganizationMemberDto } from '@/types/planner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DefaultOrganizationContext {
  organizationId: string;
  organizationUserId: string;
  role: OrganizationRole;
  firstName: string;
  lastName: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEFAULT_GROUPS = [
  { name: 'To Do', color: '#94a3b8', sortOrder: 0 },
  { name: 'In Progress', color: '#3b82f6', sortOrder: 1 },
  { name: 'Done', color: '#22c55e', sortOrder: 2 },
] as const;

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Resolve the organization a user acts in, provisioning a default one
 * (with an OWNER membership and 3 starter columns) the first time they're seen.
 *
 * v1 assumes exactly one organization per user — there is no switcher yet,
 * so this always returns the earliest membership found.
 */
export async function getOrCreateDefaultOrganization(
  userId: string,
  displayName: string
): Promise<DefaultOrganizationContext> {
  const existing = await prisma.organizationUser.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      organizationId: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });

  if (existing) {
    return {
      organizationId: existing.organizationId,
      organizationUserId: existing.id,
      role: existing.role,
      firstName: existing.firstName,
      lastName: existing.lastName,
    };
  }

  const [firstName, ...rest] = displayName.trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(' ');

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: `${displayName}'s Workspace`,
        slug: `org-${randomUUID().slice(0, 8)}`,
      },
    });

    const organizationUser = await tx.organizationUser.create({
      data: {
        organizationId: organization.id,
        userId,
        firstName: firstName ?? displayName,
        lastName: lastName ?? '',
        role: 'OWNER',
      },
    });

    await tx.group.createMany({
      data: DEFAULT_GROUPS.map((group) => ({
        organizationId: organization.id,
        name: group.name,
        color: group.color,
        sortOrder: group.sortOrder,
      })),
    });

    return organizationUser;
  });

  return {
    organizationId: created.organizationId,
    organizationUserId: created.id,
    role: created.role,
    firstName: created.firstName,
    lastName: created.lastName,
  };
}

/**
 * List active members of an organization, for the task assignee picker.
 * Ordered by first/last name for a stable, predictable picker order.
 */
export async function listOrganizationMembers(
  organizationId: string
): Promise<OrganizationMemberDto[]> {
  const members = await prisma.organizationUser.findMany({
    where: { organizationId, status: 'ACTIVE' },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      user: { select: { image: true } },
    },
  });

  return members.map((member) => ({
    organizationUserId: member.id,
    name: `${member.firstName} ${member.lastName}`.trim(),
    avatarUrl: member.user.image ?? null,
    role: member.role,
  }));
}
