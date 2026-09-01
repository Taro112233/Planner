// services/dashboard.service.ts
// Dashboard Service — Layer 2 (Business Logic + Database)
// Backs the two cross-plan pages from the mockup: "หน้าแรก" (home) and
// "งานของฉัน" (my tasks).
//
// Both read across every plan in the workspace, which is why they live here
// rather than in board.service.ts (scoped to one board).
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { Prisma } from '@prisma/client';
import type {
  DueBucketKey,
  HomeSummaryDto,
  MyTaskDto,
  MyTasksDto,
  TaskActivityDto,
} from '@/types/planner';

const ACTIVITY_SELECT = {
  id: true,
  action: true,
  actorNameSnapshot: true,
  actorAvatarSnapshot: true,
  targetTitle: true,
  createdAt: true,
} satisfies Prisma.TaskActivitySelect;

/**
 * A card counts as done when it sits in the last column of its plan — the same
 * rule listPlans uses, because status on this board is column membership
 * rather than TaskItem.status.
 */
async function loadDoneGroupIds(organizationId: string): Promise<Set<string>> {
  const plans = await prisma.plan.findMany({
    where: { organizationId, deletedAt: null },
    select: { groups: { orderBy: { sortOrder: 'asc' }, select: { id: true } } },
  });

  const doneGroupIds = new Set<string>();
  plans.forEach((plan) => {
    const last = plan.groups[plan.groups.length - 1];
    if (last) doneGroupIds.add(last.id);
  });
  return doneGroupIds;
}

const TASK_ROW_SELECT = {
  id: true,
  title: true,
  groupId: true,
  dueDate: true,
  priority: true,
  subtaskTotal: true,
  subtaskDone: true,
  group: {
    select: {
      name: true,
      color: true,
      planId: true,
      plan: { select: { name: true } },
    },
  },
} satisfies Prisma.TaskItemSelect;

type TaskRow = Prisma.TaskItemGetPayload<{ select: typeof TASK_ROW_SELECT }>;

function serializeMyTask(task: TaskRow): MyTaskDto {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    subtaskTotal: task.subtaskTotal,
    subtaskDone: task.subtaskDone,
    groupName: task.group?.name ?? '',
    groupColor: task.group?.color ?? null,
    planId: task.group?.planId ?? null,
    planName: task.group?.plan?.name ?? '',
  };
}

function endOfToday(now: Date): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Which bucket a card falls in. Undated work sits in "ถัดไป". */
function bucketFor(dueDate: Date | null, now: Date): DueBucketKey {
  if (!dueDate) return 'later';

  const todayEnd = endOfToday(now);
  if (dueDate <= todayEnd) return 'overdue';

  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return dueDate <= weekEnd ? 'week' : 'later';
}

/**
 * Every unfinished card assigned to the caller, across every plan in the
 * workspace, split into the mockup's three due windows.
 */
export async function getMyTasks(
  organizationId: string,
  organizationUserId: string
): Promise<MyTasksDto> {
  const doneGroupIds = await loadDoneGroupIds(organizationId);

  const tasks = await prisma.taskItem.findMany({
    where: {
      organizationId,
      deletedAt: null,
      assignees: { some: { organizationUserId } },
    },
    // Undated cards last, which matches how the buckets read top to bottom.
    orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    select: TASK_ROW_SELECT,
  });

  const now = new Date();
  const open = tasks.filter((task) => !doneGroupIds.has(task.groupId));

  const buckets: Record<DueBucketKey, MyTaskDto[]> = { overdue: [], week: [], later: [] };
  open.forEach((task) => {
    buckets[bucketFor(task.dueDate, now)].push(serializeMyTask(task));
  });

  return {
    overdue: buckets.overdue,
    week: buckets.week,
    later: buckets.later,
    openCount: open.length,
    doneCount: tasks.length - open.length,
  };
}

/**
 * The home page: four counters, what is due next, and what the workspace has
 * been doing lately.
 */
export async function getHomeSummary(
  organizationId: string,
  organizationUserId: string
): Promise<HomeSummaryDto> {
  const doneGroupIds = await loadDoneGroupIds(organizationId);
  const now = new Date();
  const todayEnd = endOfToday(now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [mine, teamTasks, checkedToday, activityRows] = await Promise.all([
    prisma.taskItem.findMany({
      where: {
        organizationId,
        deletedAt: null,
        assignees: { some: { organizationUserId } },
      },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }],
      select: TASK_ROW_SELECT,
    }),
    prisma.taskItem.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }],
      select: TASK_ROW_SELECT,
    }),
    // "จาก audit log" in the mockup — the tick events themselves, not a
    // derived count, so unticking something removes it from today's tally.
    prisma.taskActivity.count({
      where: {
        organizationId,
        action: 'SUBTASK_CHECKED',
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.taskActivity.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: ACTIVITY_SELECT,
    }),
  ]);

  const myOpen = mine.filter((task) => !doneGroupIds.has(task.groupId));
  const teamOpen = teamTasks.filter((task) => !doneGroupIds.has(task.groupId));
  const myOverdue = myOpen.filter((task) => task.dueDate !== null && task.dueDate < todayStart);

  // Due soon spans the whole workspace, matching the mockup's "ทุกแผนงาน".
  const dueSoon = teamOpen.filter((task) => task.dueDate !== null).slice(0, 7);

  return {
    myOpenCount: myOpen.length,
    myOverdueCount: myOverdue.length,
    teamOpenCount: teamOpen.length,
    checkedTodayCount: checkedToday,
    dueSoon: dueSoon.map(serializeMyTask),
    activities: activityRows.map(
      (row): TaskActivityDto => ({
        id: row.id,
        action: row.action,
        actorNameSnapshot: row.actorNameSnapshot,
        actorAvatarUrl: row.actorAvatarSnapshot ?? null,
        targetTitle: row.targetTitle,
        createdAt: row.createdAt.toISOString(),
      })
    ),
  };
}
