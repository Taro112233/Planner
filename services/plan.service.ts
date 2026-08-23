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
import type { PlanDto, PlanGroupDto, PlanSummaryDto } from '@/types/planner';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Adopts the columns of an organization created before Plan existed. */
export const DEFAULT_PLAN_NAME = 'แผนงานหลัก';

const DUPLICATE_ENTRY = 'Duplicate entry';
const PLAN_NOT_FOUND = 'Plan not found';
const PLAN_GROUP_NOT_FOUND = 'Plan group not found';
const CANNOT_DELETE_LAST_PLAN = 'Cannot delete the last plan';

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
  options: { planGroupId?: string | null; color?: string | null } = {}
): Promise<PlanDto> {
  const { planGroupId = null, color = null } = options;

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
  patch: { name?: string; color?: string | null; planGroupId?: string | null }
): Promise<PlanDto> {
  const existing = await prisma.plan.findFirst({
    where: { id: planId, organizationId, deletedAt: null },
    select: { id: true },
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
    return await prisma.plan.update({ where: { id: planId }, data, select: PLAN_SELECT });
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
  planId: string
): Promise<{ id: string }> {
  const existing = await prisma.plan.findFirst({
    where: { id: planId, organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error(PLAN_NOT_FOUND);

  // Checked before the write: an organization with no plan has no board to
  // render, and getOrCreateDefaultPlan would silently make a new empty one.
  const planCount = await prisma.plan.count({ where: { organizationId, deletedAt: null } });
  if (planCount <= 1) throw new Error(CANNOT_DELETE_LAST_PLAN);

  await prisma.plan.update({ where: { id: planId }, data: { deletedAt: new Date() } });
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
  color: string | null
): Promise<PlanGroupDto> {
  const last = await prisma.planGroup.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  try {
    const planGroup = await prisma.planGroup.create({
      data: { organizationId, name, color, sortOrder: (last?.sortOrder ?? -1) + 1 },
      select: PLAN_GROUP_SELECT,
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
