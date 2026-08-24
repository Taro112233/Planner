// services/plan.service.ts
// Plan Service — Layer 2 (Business Logic + Database)
// Covers the two container levels above the Kanban column: PlanGroup ("กลุ่ม")
// and Plan ("แผนงาน" — one board).
//
// ⚠️ `Group` is the COLUMN model. The mockup's "กลุ่ม" is PlanGroup.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { Prisma } from '@prisma/client';
import type { ActorInput } from '@/services/board.service';
import type {
  PlanDto,
  PlanGroupDto,
  PlanGroupJoinResultDto,
  PlanGroupJoinSettingsDto,
  PlanGroupOverviewDto,
  PlanSummaryDto,
} from '@/types/planner';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Adopts the columns of an organization created before Plan existed. */
export const DEFAULT_PLAN_NAME = 'แผนงานหลัก';

const DUPLICATE_ENTRY = 'Duplicate entry';
const PLAN_NOT_FOUND = 'Plan not found';
const PLAN_GROUP_NOT_FOUND = 'Plan group not found';
const CANNOT_DELETE_LAST_PLAN = 'Cannot delete the last plan';
const ONLY_OWNER_CAN_MANAGE_JOIN_CODE = 'Only the group owner can manage the join code';

const PLAN_SELECT = {
  id: true,
  organizationId: true,
  planGroupId: true,
  name: true,
  color: true,
  icon: true,
  sortOrder: true,
} satisfies Prisma.PlanSelect;

const PLAN_GROUP_SELECT = {
  id: true,
  name: true,
  description: true,
  color: true,
  icon: true,
  sortOrder: true,
} satisfies Prisma.PlanGroupSelect;

const PLAN_GROUP_WITH_JOIN_SELECT = {
  ...PLAN_GROUP_SELECT,
  ownerId: true,
  joinCode: true,
  joinCodeEnabled: true,
} satisfies Prisma.PlanGroupSelect;

/** Columns every activity read needs to build a TaskActivityDto. */
const ACTIVITY_SELECT = {
  id: true,
  action: true,
  actorNameSnapshot: true,
  actorAvatarSnapshot: true,
  targetTitle: true,
  createdAt: true,
} satisfies Prisma.TaskActivitySelect;

/**
 * Record a plan-level event. Like the column events in board.service.ts these
 * carry no taskItemId — the plan name goes in targetTitle, and planId is what
 * the group overview filters on.
 */
async function writePlanActivity(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    planId: string;
    planName: string;
    actor: ActorInput;
    action: 'PLAN_CREATED' | 'PLAN_RENAMED' | 'PLAN_DELETED';
    changes?: Prisma.InputJsonValue;
  }
): Promise<void> {
  await tx.taskActivity.create({
    data: {
      organizationId: params.organizationId,
      planId: params.planId,
      planNameSnapshot: params.planName,
      actorId: params.actor.organizationUserId,
      actorUserIdSnapshot: params.actor.userId,
      actorNameSnapshot: params.actor.name,
      actorAvatarSnapshot: params.actor.avatarUrl,
      actorRoleSnapshot: params.actor.role,
      action: params.action,
      targetTitle: params.planName,
      ...(params.changes ? { changes: params.changes } : {}),
    },
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

// ─────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────

/**
 * Resolve the plan a board request acts on, provisioning one the first time.
 *
 * Organizations created before Plan existed own columns with `planId = null`.
 * Rather than requiring an offline backfill before the app works, the first
 * request adopts those orphans into a new default plan — the same lazy
 * provisioning getOrCreateDefaultOrganization already uses. Running
 * scripts/backfill-plans.ts does the same thing in bulk, ahead of time.
 */
export async function getOrCreateDefaultPlan(organizationId: string): Promise<PlanDto> {
  const existing = await prisma.plan.findFirst({
    where: { organizationId, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: PLAN_SELECT,
  });

  if (existing) {
    // A plan can exist while older columns still dangle (a half-finished
    // backfill, or columns created before the plan). Adopt them.
    await prisma.group.updateMany({
      where: { organizationId, planId: null },
      data: { planId: existing.id },
    });
    return existing;
  }

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: { organizationId, name: DEFAULT_PLAN_NAME, sortOrder: 0 },
      select: PLAN_SELECT,
    });

    await tx.group.updateMany({
      where: { organizationId, planId: null },
      data: { planId: plan.id },
    });

    return plan;
  });
}

/**
 * @throws Error('Plan not found')
 */
export async function getPlan(organizationId: string, planId: string): Promise<PlanDto> {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, organizationId, deletedAt: null },
    select: PLAN_SELECT,
  });
  if (!plan) throw new Error(PLAN_NOT_FOUND);
  return plan;
}

/**
 * Plans with the counters the sidebar and the group overview render:
 * card total, completed total, and a per-column breakdown.
 */
export async function listPlans(
  organizationId: string,
  planGroupId?: string | null
): Promise<PlanSummaryDto[]> {
  const plans = await prisma.plan.findMany({
    where: {
      organizationId,
      deletedAt: null,
      ...(planGroupId !== undefined ? { planGroupId } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      ...PLAN_SELECT,
      groups: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { taskItems: { where: { deletedAt: null } } } },
        },
      },
    },
  });

  // Completed cards are those in the last column, matching how the board reads
  // "done" today: status lives in column membership, not TaskItem.status.
  return plans.map((plan) => {
    const columns = plan.groups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      taskCount: group._count.taskItems,
    }));
    const taskCount = columns.reduce((total, column) => total + column.taskCount, 0);
    const doneCount = columns.length > 0 ? columns[columns.length - 1].taskCount : 0;

    return {
      id: plan.id,
      organizationId: plan.organizationId,
      planGroupId: plan.planGroupId,
      name: plan.name,
      color: plan.color,
      icon: plan.icon,
      sortOrder: plan.sortOrder,
      taskCount,
      doneCount,
      completionPct: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
      columns,
    };
  });
}

/**
 * Create a plan with the same three starter columns a new organization gets,
 * so the board is never empty on arrival.
 *
 * @throws Error('Duplicate entry')
 * @throws Error('Plan group not found')
 */
export async function createPlan(
  organizationId: string,
  name: string,
  options: { planGroupId?: string | null; color?: string | null; actor?: ActorInput } = {}
): Promise<PlanDto> {
  const { planGroupId = null, color = null, actor } = options;

  if (planGroupId) {
    const planGroup = await prisma.planGroup.findFirst({
      where: { id: planGroupId, organizationId },
      select: { id: true },
    });
    if (!planGroup) throw new Error(PLAN_GROUP_NOT_FOUND);
  }

  const last = await prisma.plan.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          organizationId,
          planGroupId,
          name,
          color,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
        select: PLAN_SELECT,
      });

      await tx.group.createMany({
        data: DEFAULT_PLAN_COLUMNS.map((column) => ({
          organizationId,
          planId: plan.id,
          name: column.name,
          color: column.color,
          sortOrder: column.sortOrder,
        })),
      });

      if (actor) {
        await writePlanActivity(tx, {
          organizationId,
          planId: plan.id,
          planName: plan.name,
          actor,
          action: 'PLAN_CREATED',
          changes: { planGroupId },
        });
      }

      return plan;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/** Starter columns for a brand-new plan — mirrors organization.service.ts. */
const DEFAULT_PLAN_COLUMNS = [
  { name: 'To Do', color: 'slate', sortOrder: 0 },
  { name: 'In Progress', color: 'blue', sortOrder: 1 },
  { name: 'Done', color: 'green', sortOrder: 2 },
] as const;

/**
 * Patch a plan. Only the keys present are written, so an omitted key can never
 * blank a field (the rule updateGroup and createTask follow).
 *
 * `planGroupId: null` detaches the plan from its group.
 *
 * @throws Error('Plan not found')
 * @throws Error('Plan group not found')
 * @throws Error('Duplicate entry')
 */
export async function updatePlan(
  organizationId: string,
  planId: string,
  patch: { name?: string; color?: string | null; planGroupId?: string | null },
  actor?: ActorInput
): Promise<PlanDto> {
  const existing = await prisma.plan.findFirst({
    where: { id: planId, organizationId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) throw new Error(PLAN_NOT_FOUND);

  if (patch.planGroupId) {
    const planGroup = await prisma.planGroup.findFirst({
      where: { id: patch.planGroupId, organizationId },
      select: { id: true },
    });
    if (!planGroup) throw new Error(PLAN_GROUP_NOT_FOUND);
  }

  const data: Prisma.PlanUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.color !== undefined) data.color = patch.color;
  if (patch.planGroupId !== undefined) {
    data.planGroup = patch.planGroupId
      ? { connect: { id_organizationId: { id: patch.planGroupId, organizationId } } }
      : { disconnect: true };
  }

  try {
    const updated = await prisma.plan.update({ where: { id: planId }, data, select: PLAN_SELECT });

    // Only a rename is worth an event: recolouring and moving between groups
    // change presentation, not the plan itself.
    if (actor && patch.name !== undefined && patch.name !== existing.name) {
      await prisma.$transaction((tx) =>
        writePlanActivity(tx, {
          organizationId,
          planId,
          planName: updated.name,
          actor,
          action: 'PLAN_RENAMED',
          changes: { field: 'name', before: existing.name, after: updated.name },
        })
      );
    }

    return updated;
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/**
 * Soft-delete a plan. Its columns and cards are left untouched so a later
 * restore brings the whole board back — nothing cascades on `deletedAt`.
 *
 * @throws Error('Plan not found')
 * @throws Error('Cannot delete the last plan')
 */
export async function deletePlan(
  organizationId: string,
  planId: string,
  actor?: ActorInput
): Promise<{ id: string }> {
  const existing = await prisma.plan.findFirst({
    where: { id: planId, organizationId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) throw new Error(PLAN_NOT_FOUND);

  // Checked before the write: an organization with no plan has no board to
  // render, and getOrCreateDefaultPlan would silently make a new empty one.
  const planCount = await prisma.plan.count({ where: { organizationId, deletedAt: null } });
  if (planCount <= 1) throw new Error(CANNOT_DELETE_LAST_PLAN);

  await prisma.$transaction(async (tx) => {
    await tx.plan.update({ where: { id: planId }, data: { deletedAt: new Date() } });

    if (actor) {
      await writePlanActivity(tx, {
        organizationId,
        planId,
        planName: existing.name,
        actor,
        action: 'PLAN_DELETED',
      });
    }
  });

  return { id: planId };
}

// ─────────────────────────────────────────────
// Plan groups
// ─────────────────────────────────────────────

/** Groups with the plan count the sidebar badge shows. */
export async function listPlanGroups(organizationId: string): Promise<PlanGroupDto[]> {
  const planGroups = await prisma.planGroup.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      ...PLAN_GROUP_SELECT,
      _count: { select: { plans: { where: { deletedAt: null } } } },
    },
  });

  return planGroups.map(({ _count, ...planGroup }) => ({
    ...planGroup,
    planCount: _count.plans,
  }));
}

/**
 * @throws Error('Duplicate entry')
 */
export async function createPlanGroup(
  organizationId: string,
  name: string,
  color: string | null,
  ownerId?: string
): Promise<PlanGroupDto> {
  const last = await prisma.planGroup.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  try {
    const planGroup = await prisma.$transaction(async (tx) => {
      const created = await tx.planGroup.create({
        data: {
          organizationId,
          name,
          color,
          sortOrder: (last?.sortOrder ?? -1) + 1,
          ownerId,
        },
        select: PLAN_GROUP_SELECT,
      });

      // The creator is the first member, so the roster is never empty.
      if (ownerId) {
        await tx.planGroupMember.create({
          data: {
            organizationId,
            planGroupId: created.id,
            organizationUserId: ownerId,
            role: 'OWNER',
          },
        });
      }

      return created;
    });

    return { ...planGroup, planCount: 0 };
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/**
 * @throws Error('Plan group not found')
 * @throws Error('Duplicate entry')
 */
export async function updatePlanGroup(
  organizationId: string,
  planGroupId: string,
  patch: { name?: string; color?: string | null; description?: string | null }
): Promise<PlanGroupDto> {
  const existing = await prisma.planGroup.findFirst({
    where: { id: planGroupId, organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error(PLAN_GROUP_NOT_FOUND);

  const data: Prisma.PlanGroupUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.color !== undefined) data.color = patch.color;
  if (patch.description !== undefined) data.description = patch.description;

  try {
    const planGroup = await prisma.planGroup.update({
      where: { id: planGroupId },
      data,
      select: { ...PLAN_GROUP_SELECT, _count: { select: { plans: { where: { deletedAt: null } } } } },
    });
    const { _count, ...rest } = planGroup;
    return { ...rest, planCount: _count.plans };
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/**
 * Delete a group, detaching its plans first.
 *
 * The FK is Restrict rather than SetNull because the composite key includes
 * the required organizationId, which Postgres would blank along with it (see
 * prisma/schemas/plan.prisma). Detaching in the same transaction gives the
 * intended behaviour: the group goes, the work inside it stays.
 *
 * @throws Error('Plan group not found')
 */
export async function deletePlanGroup(
  organizationId: string,
  planGroupId: string
): Promise<{ id: string; detachedPlanCount: number }> {
  const existing = await prisma.planGroup.findFirst({
    where: { id: planGroupId, organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error(PLAN_GROUP_NOT_FOUND);

  const detached = await prisma.$transaction(async (tx) => {
    const result = await tx.plan.updateMany({
      where: { organizationId, planGroupId },
      data: { planGroupId: null },
    });

    await tx.planGroup.delete({ where: { id: planGroupId } });
    return result.count;
  });

  return { id: planGroupId, detachedPlanCount: detached };
}

// ─────────────────────────────────────────────
// Group overview
// ─────────────────────────────────────────────

/**
 * Everything the group overview page renders, in one call: the group itself,
 * its plans with progress, a member roster with open-task counts, and recent
 * activity across the group's plans.
 *
 * Activity is looked up by task id rather than TaskActivity.planId, which is
 * denormalized but not yet backfilled everywhere. The trade-off is that
 * activity for permanently deleted cards drops out of this feed — acceptable
 * for an overview, and it means the page works without a migration.
 *
 * @throws Error('Plan group not found')
 */
export async function getPlanGroupOverview(
  organizationId: string,
  planGroupId: string,
  options: { activityLimit?: number; viewerOrganizationUserId?: string } = {}
): Promise<PlanGroupOverviewDto> {
  const { activityLimit = 7, viewerOrganizationUserId } = options;

  const row = await prisma.planGroup.findFirst({
    where: { id: planGroupId, organizationId },
    select: PLAN_GROUP_WITH_JOIN_SELECT,
  });
  if (!row) throw new Error(PLAN_GROUP_NOT_FOUND);

  const { ownerId, joinCode, joinCodeEnabled, ...planGroup } = row;
  // The invite code is an owner-only secret. Groups created before ownership
  // existed have no owner, so anyone in the workspace can claim and manage it.
  const viewerIsOwner = !ownerId || ownerId === viewerOrganizationUserId;

  const plans = await listPlans(organizationId, planGroupId);
  const planIds = plans.map((plan) => plan.id);

  const [openTasks, members, activityRows] = await Promise.all([
    // Open = not in the plan's last column, mirroring how listPlans counts
    // "done": status is column membership on this board.
    prisma.taskItem.findMany({
      where: {
        organizationId,
        deletedAt: null,
        group: { planId: { in: planIds } },
      },
      select: {
        groupId: true,
        assignees: { select: { organizationUserId: true } },
      },
    }),
    prisma.organizationUser.findMany({
      where: { organizationId, status: 'ACTIVE' },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        user: { select: { image: true } },
      },
    }),
    planIds.length === 0
      ? Promise.resolve([])
      : prisma.taskItem
          .findMany({
            where: { organizationId, group: { planId: { in: planIds } } },
            select: { id: true },
          })
          .then((tasks) =>
            prisma.taskActivity.findMany({
              // Two ways in on purpose: planId catches structural events (which
              // have no card) and everything written since the denormalization
              // landed, while taskItemId still finds card events on rows that
              // predate it.
              where: {
                organizationId,
                OR: [
                  { planId: { in: planIds } },
                  ...(tasks.length > 0
                    ? [{ taskItemId: { in: tasks.map((task) => task.id) } }]
                    : []),
                ],
              },
              orderBy: { createdAt: 'desc' },
              take: activityLimit,
              select: ACTIVITY_SELECT,
            })
          ),
  ]);

  // A card counts as open unless it sits in its plan's final column.
  const doneGroupIds = new Set(
    plans
      .map((plan) => plan.columns[plan.columns.length - 1]?.id)
      .filter((id): id is string => Boolean(id))
  );

  const openCountByMember = new Map<string, number>();
  openTasks.forEach((task) => {
    if (doneGroupIds.has(task.groupId)) return;
    task.assignees.forEach((assignee) => {
      openCountByMember.set(
        assignee.organizationUserId,
        (openCountByMember.get(assignee.organizationUserId) ?? 0) + 1
      );
    });
  });

  return {
    planGroup: { ...planGroup, planCount: plans.length },
    joinSettings: viewerIsOwner
      ? { id: planGroup.id, joinCode, joinCodeEnabled }
      : null,
    isOwner: viewerIsOwner,
    plans,
    members: members.map((member) => ({
      organizationUserId: member.id,
      name: `${member.firstName} ${member.lastName}`.trim(),
      avatarUrl: member.user.image ?? null,
      role: member.role,
      openTaskCount: openCountByMember.get(member.id) ?? 0,
    })),
    activities: activityRows.map((row) => ({
      id: row.id,
      action: row.action,
      actorNameSnapshot: row.actorNameSnapshot,
      actorAvatarUrl: row.actorAvatarSnapshot ?? null,
      targetTitle: row.targetTitle,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

// ─────────────────────────────────────────────
// Join codes (MS Teams style)
// ─────────────────────────────────────────────

/**
 * Alphabet for invite codes: no 0/O/1/I/L, so a code read aloud or copied off
 * a screen cannot be mistyped into a different valid code.
 */
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const JOIN_CODE_LENGTH = 8;

function randomJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(JOIN_CODE_LENGTH));
  const body = Array.from(bytes, (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length]).join(
    ''
  );
  // Grouped for readability — stored and compared in this exact form.
  return `${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Codes are typed by humans: accept any case and stray spaces. */
export function normalizeJoinCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== JOIN_CODE_LENGTH) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

/**
 * Issue (or re-issue) a group's join code. Regenerating invalidates whatever
 * was shared before, which is the point of the button.
 *
 * @throws Error('Plan group not found')
 * @throws Error('Only the group owner can manage the join code')
 */
export async function regenerateJoinCode(
  organizationId: string,
  planGroupId: string,
  organizationUserId: string
): Promise<PlanGroupJoinSettingsDto> {
  await assertGroupOwner(organizationId, planGroupId, organizationUserId);

  // The unique index is global, so a collision is possible in principle;
  // retry rather than fail the request.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = randomJoinCode();
    try {
      const updated = await prisma.planGroup.update({
        where: { id: planGroupId },
        data: { joinCode, joinCodeEnabled: true },
        select: { id: true, joinCode: true, joinCodeEnabled: true },
      });
      return updated as PlanGroupJoinSettingsDto;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  throw new Error('Could not generate a unique join code');
}

/**
 * Open or close the group to new members without changing the code, so the
 * owner can pause joining and resume it with the same link.
 *
 * @throws Error('Plan group not found')
 * @throws Error('Only the group owner can manage the join code')
 * @throws Error('Generate a join code first')
 */
export async function setJoinCodeEnabled(
  organizationId: string,
  planGroupId: string,
  organizationUserId: string,
  enabled: boolean
): Promise<PlanGroupJoinSettingsDto> {
  const group = await assertGroupOwner(organizationId, planGroupId, organizationUserId);
  if (enabled && !group.joinCode) throw new Error('Generate a join code first');

  const updated = await prisma.planGroup.update({
    where: { id: planGroupId },
    data: { joinCodeEnabled: enabled },
    select: { id: true, joinCode: true, joinCodeEnabled: true },
  });
  return updated as PlanGroupJoinSettingsDto;
}

/**
 * Join a group by code.
 *
 * The group lives in someone else's organization, so this adds the joiner
 * there first (as a MEMBER) and then to the group — the workspace is the
 * tenant boundary, and without membership in it they could not read a single
 * card. Re-running with the same code is a no-op that returns the group.
 *
 * @throws Error('Invalid join code')
 * @throws Error('This group is not accepting new members')
 */
export async function joinPlanGroupByCode(
  userId: string,
  displayName: string,
  code: string
): Promise<PlanGroupJoinResultDto> {
  const joinCode = normalizeJoinCode(code);

  const group = await prisma.planGroup.findUnique({
    where: { joinCode },
    select: { id: true, name: true, organizationId: true, joinCodeEnabled: true },
  });
  if (!group) throw new Error('Invalid join code');
  if (!group.joinCodeEnabled) throw new Error('This group is not accepting new members');

  const [firstName, ...rest] = displayName.trim().split(/\s+/).filter(Boolean);

  return prisma.$transaction(async (tx) => {
    const membership =
      (await tx.organizationUser.findFirst({
        where: { organizationId: group.organizationId, userId },
        select: { id: true, status: true },
      })) ??
      (await tx.organizationUser.create({
        data: {
          organizationId: group.organizationId,
          userId,
          firstName: firstName ?? displayName,
          lastName: rest.join(' '),
          role: 'MEMBER',
        },
        select: { id: true, status: true },
      }));

    // Someone who left and is re-joining with a fresh code becomes active again.
    if (membership.status !== 'ACTIVE') {
      await tx.organizationUser.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE', leftAt: null },
      });
    }

    const existing = await tx.planGroupMember.findFirst({
      where: { planGroupId: group.id, organizationUserId: membership.id },
      select: { id: true },
    });

    if (!existing) {
      await tx.planGroupMember.create({
        data: {
          organizationId: group.organizationId,
          planGroupId: group.id,
          organizationUserId: membership.id,
          role: 'MEMBER',
        },
      });
    }

    return {
      planGroupId: group.id,
      planGroupName: group.name,
      organizationId: group.organizationId,
      alreadyMember: Boolean(existing),
    };
  });
}

/**
 * @throws Error('Plan group not found')
 * @throws Error('Only the group owner can manage the join code')
 */
async function assertGroupOwner(
  organizationId: string,
  planGroupId: string,
  organizationUserId: string
): Promise<{ id: string; joinCode: string | null }> {
  const group = await prisma.planGroup.findFirst({
    where: { id: planGroupId, organizationId },
    select: { id: true, ownerId: true, joinCode: true },
  });
  if (!group) throw new Error(PLAN_GROUP_NOT_FOUND);

  // Groups created before ownership existed have no owner; the first member to
  // manage the code claims it rather than locking everyone out.
  if (group.ownerId && group.ownerId !== organizationUserId) {
    throw new Error(ONLY_OWNER_CAN_MANAGE_JOIN_CODE);
  }
  if (!group.ownerId) {
    await prisma.planGroup.update({
      where: { id: planGroupId },
      data: { ownerId: organizationUserId },
    });
  }

  return { id: group.id, joinCode: group.joinCode };
}
