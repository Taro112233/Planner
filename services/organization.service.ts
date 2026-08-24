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
import type { OrganizationMemberDto, WorkspaceDto } from '@/types/planner';
import { DEFAULT_PLAN_NAME } from '@/services/plan.service';

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

// Palette keys, not hex — see lib/shared/group-colors.ts. Organizations
// provisioned before this change keep their hex and still render (the resolver
// passes an unrecognized value straight through).
const DEFAULT_GROUPS = [
  { name: 'To Do', color: 'slate', sortOrder: 0 },
  { name: 'In Progress', color: 'blue', sortOrder: 1 },
  { name: 'Done', color: 'green', sortOrder: 2 },
] as const;

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Resolve the organization a user acts in, provisioning a default one
 * (with an OWNER membership, a default Plan, and 3 starter columns inside it)
 * the first time they're seen.
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

    // Columns hang off a Plan, never off the organization directly. Older
    // organizations predate Plan; getOrCreateDefaultPlan adopts their columns
    // on first use (services/plan.service.ts).
    const plan = await tx.plan.create({
      data: { organizationId: organization.id, name: DEFAULT_PLAN_NAME, sortOrder: 0 },
      select: { id: true },
    });

    await tx.group.createMany({
      data: DEFAULT_GROUPS.map((group) => ({
        organizationId: organization.id,
        planId: plan.id,
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

/**
 * Every workspace the user can act in — their own, plus any they joined with a
 * group code (services/plan.service.ts joinPlanGroupByCode).
 */
export async function listUserWorkspaces(userId: string): Promise<WorkspaceDto[]> {
  const memberships = await prisma.organizationUser.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  return memberships.map((membership) => ({
    organizationId: membership.organization.id,
    organizationUserId: membership.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));
}

/**
 * The organization a request acts in.
 *
 * `requestedOrganizationId` is the workspace the user last switched to. It is
 * only honoured when they still hold an ACTIVE membership there — a stale
 * cookie, or one pointing at a workspace they left, silently falls back to
 * their default rather than failing the request.
 */
export async function resolveActiveOrganization(
  userId: string,
  displayName: string,
  requestedOrganizationId?: string | null
): Promise<DefaultOrganizationContext> {
  if (requestedOrganizationId) {
    const membership = await prisma.organizationUser.findFirst({
      where: { userId, organizationId: requestedOrganizationId, status: 'ACTIVE' },
      select: {
        id: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (membership) {
      return {
        organizationId: membership.organizationId,
        organizationUserId: membership.id,
        role: membership.role,
        firstName: membership.firstName,
        lastName: membership.lastName,
      };
    }
  }

  return getOrCreateDefaultOrganization(userId, displayName);
}
