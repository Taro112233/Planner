// services/board.service.ts
// Board Service — Layer 2 (Business Logic + Database)
// Covers: the Kanban board (Group columns + TaskItem cards), task creation,
// drag-and-drop reordering, task detail + subtask tree, and subtask toggling.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { Prisma } from '@prisma/client';
import type { OrganizationRole } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import type {
  BoardDto,
  BoardGroupDto,
  BoardTaskDto,
  GroupSummaryDto,
  SubtaskNodeDto,
  TaskActivityDto,
  TaskDetailDto,
  TaskPriority,
  TrashedTaskDto,
} from '@/types/planner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** The acting user's identity, used for TaskActivity snapshots. */
export interface ActorInput {
  organizationUserId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: OrganizationRole;
}

// ─────────────────────────────────────────────
// Shared Prisma select projections
// ─────────────────────────────────────────────

const TASK_ITEM_SELECT = {
  id: true,
  groupId: true,
  title: true,
  status: true,
  priority: true,
  position: true,
  startDate: true,
  dueDate: true,
  subtaskTotal: true,
  subtaskDone: true,
  createdAt: true,
  updatedAt: true,
  assignees: {
    select: {
      organizationUserId: true,
      assignee: {
        select: {
          firstName: true,
          lastName: true,
          user: { select: { image: true } },
        },
      },
    },
  },
  badges: {
    select: {
      badge: { select: { id: true, name: true, color: true } },
    },
  },
} satisfies Prisma.TaskItemSelect;

const TASK_DETAIL_SELECT = {
  ...TASK_ITEM_SELECT,
  description: true,
} satisfies Prisma.TaskItemSelect;

type TaskItemWithRelations = Prisma.TaskItemGetPayload<{ select: typeof TASK_ITEM_SELECT }>;
type TaskDetailRow = Prisma.TaskItemGetPayload<{ select: typeof TASK_DETAIL_SELECT }>;

interface SubtaskRow {
  id: string;
  parentSubtaskId: string | null;
  title: string;
  isDone: boolean;
  depth: number;
  childTotal: number;
  childDone: number;
  checkedByNameSnapshot?: string | null;
  checkedByAvatarSnapshot?: string | null;
  checkedAt?: Date | null;
}

/** Columns every subtask read needs to build a SubtaskNodeDto. */
const SUBTASK_NODE_SELECT = {
  id: true,
  parentSubtaskId: true,
  title: true,
  isDone: true,
  depth: true,
  childTotal: true,
  childDone: true,
  checkedByNameSnapshot: true,
  checkedByAvatarSnapshot: true,
  checkedAt: true,
} satisfies Prisma.SubtaskSelect;

/** Columns every activity read needs to build a TaskActivityDto. */
const ACTIVITY_SELECT = {
  id: true,
  action: true,
  actorNameSnapshot: true,
  actorAvatarSnapshot: true,
  targetTitle: true,
  createdAt: true,
} satisfies Prisma.TaskActivitySelect;

interface ActivityRow {
  id: string;
  action: TaskActivityDto['action'];
  actorNameSnapshot: string;
  actorAvatarSnapshot?: string | null;
  targetTitle: string | null;
  createdAt: Date;
}

function serializeActivity(row: ActivityRow): TaskActivityDto {
  return {
    id: row.id,
    action: row.action,
    actorNameSnapshot: row.actorNameSnapshot,
    actorAvatarUrl: row.actorAvatarSnapshot ?? null,
    targetTitle: row.targetTitle,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─────────────────────────────────────────────
// Serialization helpers
// ─────────────────────────────────────────────

function serializeBoardTask(task: TaskItemWithRelations): BoardTaskDto {
  return {
    id: task.id,
    groupId: task.groupId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    position: task.position.toString(),
    startDate: task.startDate?.toISOString() ?? null,
    dueDate: task.dueDate?.toISOString() ?? null,
    subtaskTotal: task.subtaskTotal,
    subtaskDone: task.subtaskDone,
    assignees: task.assignees.map((a) => ({
      organizationUserId: a.organizationUserId,
      name: `${a.assignee.firstName} ${a.assignee.lastName}`.trim(),
      avatarUrl: a.assignee.user.image ?? null,
    })),
    badges: task.badges.map((b) => ({
      id: b.badge.id,
      name: b.badge.name,
      color: b.badge.color,
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/** Assemble the flat Subtask rows (depth 0..2) into a tree by parentSubtaskId. */
function buildSubtaskTree(rows: SubtaskRow[]): SubtaskNodeDto[] {
  const nodeById = new Map<string, SubtaskNodeDto>();
  rows.forEach((row) => {
    nodeById.set(row.id, {
      id: row.id,
      title: row.title,
      isDone: row.isDone,
      depth: row.depth,
      childTotal: row.childTotal,
      childDone: row.childDone,
      checkedByName: row.checkedByNameSnapshot ?? null,
      checkedByAvatarUrl: row.checkedByAvatarSnapshot ?? null,
      // Truthiness guard rather than `?.toISOString() ?? null`: rows that omit
      // the column entirely (undefined) must serialize to null, not crash.
      checkedAt: row.checkedAt ? row.checkedAt.toISOString() : null,
      children: [],
    });
  });

  const roots: SubtaskNodeDto[] = [];
  rows.forEach((row) => {
    const node = nodeById.get(row.id)!;
    if (row.parentSubtaskId) {
      nodeById.get(row.parentSubtaskId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Compute a fractional-index Decimal position for inserting an item at
 * `index` within an ordered list of sibling positions (the moved item
 * excluded). Halves the gap to the nearest neighbor; appends past the end.
 */
function computeInsertPosition(
  sortedSiblingPositions: Prisma.Decimal[],
  index: number
): Prisma.Decimal {
  const clamped = Math.max(0, Math.min(index, sortedSiblingPositions.length));
  const prev = clamped > 0 ? sortedSiblingPositions[clamped - 1] : null;
  const next = clamped < sortedSiblingPositions.length ? sortedSiblingPositions[clamped] : null;

  if (!prev && !next) return new Prisma.Decimal(1);
  if (!prev && next) return next.div(2);
  if (prev && !next) return prev.plus(1);
  return prev!.plus(next!).div(2);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// ─────────────────────────────────────────────
// Board — read
// ─────────────────────────────────────────────

export async function getBoard(organizationId: string): Promise<BoardDto> {
  const groups = await prisma.group.findMany({
    where: { organizationId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      wipLimit: true,
      sortOrder: true,
      taskItems: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        select: TASK_ITEM_SELECT,
      },
    },
  });

  return {
    organizationId,
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      icon: group.icon,
      wipLimit: group.wipLimit,
      sortOrder: group.sortOrder,
      taskItems: group.taskItems.map(serializeBoardTask),
    })),
  };
}

// ─────────────────────────────────────────────
// Groups (columns)
// ─────────────────────────────────────────────

/**
 * @throws Error('Duplicate entry') — a column with this name already exists
 */
export async function createGroup(
  organizationId: string,
  name: string,
  color: string | null
): Promise<BoardGroupDto> {
  const last = await prisma.group.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  try {
    const group = await prisma.group.create({
      data: {
        organizationId,
        name,
        color,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
      select: { id: true, name: true, color: true, icon: true, wipLimit: true, sortOrder: true },
    });

    return { ...group, taskItems: [] };
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error('Duplicate entry');
    throw error;
  }
}

/**
 * Lightweight column list (no nested taskItems) for contexts without a full
 * board fetch, e.g. the standalone TaskPage's status picker.
 */
export async function listGroups(organizationId: string): Promise<GroupSummaryDto[]> {
  return prisma.group.findMany({
    where: { organizationId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, color: true, sortOrder: true },
  });
}

// ─────────────────────────────────────────────
// Tasks (cards)
// ─────────────────────────────────────────────

/**
 * Create a card at the end of a column.
 *
 * `priority` is optional: omitting it leaves the column out of the insert so
 * the schema default (MEDIUM) applies, which is what the column quick-add form
 * relies on. The full "New task" form passes an explicit value.
 *
 * @throws Error('Group not found')
 */
export async function createTask(
  organizationId: string,
  groupId: string,
  title: string,
  actor: ActorInput,
  priority?: TaskPriority
): Promise<BoardTaskDto> {
  const group = await prisma.group.findFirst({
    where: { id: groupId, organizationId },
    select: { id: true },
  });
  if (!group) throw new Error('Group not found');

  const last = await prisma.taskItem.findFirst({
    where: { organizationId, groupId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = last ? last.position.plus(1) : new Prisma.Decimal(1);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.taskItem.create({
      data: {
        organizationId,
        groupId,
        title,
        position,
        createdById: actor.organizationUserId,
        // Omitted entirely when undefined so the schema default stands.
        ...(priority !== undefined && { priority }),
      },
      select: TASK_ITEM_SELECT,
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: created.id,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_CREATED',
        taskItemTitleSnapshot: title,
        changes: { priority: created.priority },
      },
    });

    return created;
  });

  return serializeBoardTask(task);
}

/**
 * Move a task to a (possibly different) column at a target index, using
 * fractional positioning so siblings never need to be renumbered.
 *
 * @throws Error('Task not found')
 * @throws Error('Group not found')
 */
export async function moveTask(
  organizationId: string,
  taskId: string,
  targetGroupId: string,
  targetIndex: number,
  actor: ActorInput
): Promise<BoardTaskDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const group = await prisma.group.findFirst({
    where: { id: targetGroupId, organizationId },
    select: { id: true },
  });
  if (!group) throw new Error('Group not found');

  // `deletedAt: null` is load-bearing: trashed cards are invisible on the board,
  // so including their positions here makes computeInsertPosition pick a value
  // from a list the user can't see. Column at 1,2,3 with 2 trashed shows [1,3];
  // dropping at the end would yield (2+3)/2 = 2.5 and the card visibly jumps
  // back one slot on the next refetch.
  const siblings = await prisma.taskItem.findMany({
    where: { organizationId, groupId: targetGroupId, id: { not: taskId }, deletedAt: null },
    orderBy: { position: 'asc' },
    select: { position: true },
  });
  const position = computeInsertPosition(siblings.map((s) => s.position), targetIndex);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.taskItem.update({
      where: { id: taskId },
      data: { groupId: targetGroupId, position, version: { increment: 1 } },
      select: TASK_ITEM_SELECT,
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_MOVED',
        taskItemTitleSnapshot: task.title,
      },
    });

    return result;
  });

  return serializeBoardTask(updated);
}

// ─────────────────────────────────────────────
// Tasks — field edits (title, description, priority, dates)
// ─────────────────────────────────────────────

/**
 * @throws Error('Task not found')
 */
export async function updateTaskTitle(
  organizationId: string,
  taskId: string,
  title: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskId },
      data: { title, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_UPDATED',
        taskItemTitleSnapshot: title,
        changes: { field: 'title', before: task.title, after: title },
      },
    });
  });

  return getTaskDetail(organizationId, taskId);
}

/**
 * @throws Error('Task not found')
 */
export async function updateTaskDescription(
  organizationId: string,
  taskId: string,
  description: string | null,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true, description: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskId },
      data: { description, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_UPDATED',
        taskItemTitleSnapshot: task.title,
        changes: { field: 'description', before: task.description, after: description },
      },
    });
  });

  return getTaskDetail(organizationId, taskId);
}

/**
 * @throws Error('Task not found')
 */
export async function updateTaskPriority(
  organizationId: string,
  taskId: string,
  priority: TaskDetailDto['priority'],
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true, priority: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskId },
      data: { priority, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_UPDATED',
        taskItemTitleSnapshot: task.title,
        changes: { field: 'priority', before: task.priority, after: priority },
      },
    });
  });

  return getTaskDetail(organizationId, taskId);
}

/**
 * @throws Error('Task not found')
 */
export async function updateTaskDates(
  organizationId: string,
  taskId: string,
  dates: { startDate: string | null; dueDate: string | null },
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true, startDate: true, dueDate: true },
  });
  if (!task) throw new Error('Task not found');

  const startDate = dates.startDate ? new Date(dates.startDate) : null;
  const dueDate = dates.dueDate ? new Date(dates.dueDate) : null;

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskId },
      data: { startDate, dueDate, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_UPDATED',
        taskItemTitleSnapshot: task.title,
        changes: {
          field: 'dates',
          before: { startDate: task.startDate, dueDate: task.dueDate },
          after: { startDate, dueDate },
        },
      },
    });
  });

  return getTaskDetail(organizationId, taskId);
}

/**
 * @throws Error('Task not found')
 */
export async function getTaskDetail(
  organizationId: string,
  taskId: string
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: TASK_DETAIL_SELECT,
  });
  if (!task) throw new Error('Task not found');

  return assembleTaskDetail(organizationId, task);
}

async function assembleTaskDetail(
  organizationId: string,
  task: TaskDetailRow
): Promise<TaskDetailDto> {
  const [subtaskRows, activityRows] = await Promise.all([
    prisma.subtask.findMany({
      where: { taskItemId: task.id, organizationId },
      orderBy: { position: 'asc' },
      select: SUBTASK_NODE_SELECT,
    }),
    prisma.taskActivity.findMany({
      where: { taskItemId: task.id, organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: ACTIVITY_SELECT,
    }),
  ]);

  return {
    ...serializeBoardTask(task),
    description: task.description,
    subtasks: buildSubtaskTree(subtaskRows),
    activities: activityRows.map(serializeActivity),
  };
}

/**
 * @throws Error('Task not found')
 */
export async function listTaskActivity(
  organizationId: string,
  taskItemId: string,
  page: { skip: number; take: number }
): Promise<{ items: TaskActivityDto[]; total: number }> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!task) throw new Error('Task not found');

  const [rows, total] = await Promise.all([
    prisma.taskActivity.findMany({
      where: { taskItemId, organizationId },
      orderBy: { createdAt: 'desc' },
      skip: page.skip,
      take: page.take,
      select: ACTIVITY_SELECT,
    }),
    prisma.taskActivity.count({ where: { taskItemId, organizationId } }),
  ]);

  return {
    items: rows.map(serializeActivity),
    total,
  };
}

// ─────────────────────────────────────────────
// Subtasks
// ─────────────────────────────────────────────

/**
 * Set a subtask's isDone state to an explicit desired value — not a blind
 * toggle (see prisma/Instruction-task.md §6). The state change itself is an
 * atomic conditional update (`updateMany` guarded by `isDone: { not: desired
 * }`): if two concurrent requests both target the same desired state, only
 * the first to commit actually flips the row and applies the parent/TaskItem
 * counter delta — the second finds 0 matching rows and becomes a no-op,
 * instead of double-incrementing the counters.
 *
 * @throws Error('Task not found')
 * @throws Error('Subtask not found')
 */
export async function setSubtaskDone(
  organizationId: string,
  taskItemId: string,
  subtaskId: string,
  desiredIsDone: boolean,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskItemId, organizationId },
    select: { id: true, depth: true, parentSubtaskId: true },
  });
  if (!subtask) throw new Error('Subtask not found');

  await prisma.$transaction(async (tx) => {
    const result = await tx.subtask.updateMany({
      where: { id: subtaskId, taskItemId, organizationId, isDone: { not: desiredIsDone } },
      data: {
        isDone: desiredIsDone,
        checkedById: desiredIsDone ? actor.organizationUserId : null,
        checkedByNameSnapshot: desiredIsDone ? actor.name : null,
        checkedByAvatarSnapshot: desiredIsDone ? actor.avatarUrl : null,
        checkedAt: desiredIsDone ? new Date() : null,
        version: { increment: 1 },
      },
    });

    // A concurrent request already applied this exact state — skip the
    // counter deltas and activity log so they aren't double-applied.
    if (result.count === 0) return;

    if (subtask.parentSubtaskId) {
      await tx.subtask.update({
        where: { id: subtask.parentSubtaskId },
        data: { childDone: { increment: desiredIsDone ? 1 : -1 } },
      });
    }

    if (subtask.depth === 0) {
      await tx.taskItem.update({
        where: { id: taskItemId },
        data: { subtaskDone: { increment: desiredIsDone ? 1 : -1 } },
      });
    }

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        subtaskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: desiredIsDone ? 'SUBTASK_CHECKED' : 'SUBTASK_UNCHECKED',
        taskItemTitleSnapshot: task.title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}

// ─────────────────────────────────────────────
// Assignees
// ─────────────────────────────────────────────

/**
 * @throws Error('Task not found')
 * @throws Error('Already assigned')
 */
export async function assignTask(
  organizationId: string,
  taskId: string,
  organizationUserId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  try {
    await prisma.$transaction(async (tx) => {
      await tx.taskAssignee.create({
        data: {
          taskItemId: taskId,
          organizationId,
          organizationUserId,
          assignedById: actor.organizationUserId,
        },
      });

      await tx.taskActivity.create({
        data: {
          organizationId,
          taskItemId: taskId,
          actorId: actor.organizationUserId,
          actorUserIdSnapshot: actor.userId,
          actorNameSnapshot: actor.name,
          actorAvatarSnapshot: actor.avatarUrl,
          actorRoleSnapshot: actor.role,
          action: 'TASK_ASSIGNED',
          taskItemTitleSnapshot: task.title,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error('Already assigned');
    throw error;
  }

  return getTaskDetail(organizationId, taskId);
}

/**
 * @throws Error('Task not found')
 * @throws Error('Assignment not found')
 */
export async function unassignTask(
  organizationId: string,
  taskId: string,
  organizationUserId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const assignment = await prisma.taskAssignee.findFirst({
    where: { taskItemId: taskId, organizationId, organizationUserId },
    select: { taskItemId: true, organizationUserId: true },
  });
  if (!assignment) throw new Error('Assignment not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskAssignee.delete({
      where: { taskItemId_organizationUserId: { taskItemId: taskId, organizationUserId } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: taskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_UNASSIGNED',
        taskItemTitleSnapshot: task.title,
      },
    });
  });

  return getTaskDetail(organizationId, taskId);
}

// ─────────────────────────────────────────────
// Subtasks — create
// ─────────────────────────────────────────────

/**
 * Add a subtask. Root-level by default (depth 0); pass `parentSubtaskId` to
 * nest under an existing node (depth = parent.depth + 1, capped at 2 — I1/I2).
 *
 * If the parent was previously marked done, a new (not-done) child violates
 * invariant I5 ("done only when all direct children are done"), so the parent
 * flips back to not-done and its own completion is un-counted one level up.
 *
 * @throws Error('Task not found')
 * @throws Error('Parent subtask not found')
 * @throws Error('Maximum subtask depth exceeded')
 */
export async function addSubtask(
  organizationId: string,
  taskItemId: string,
  title: string,
  actor: ActorInput,
  parentSubtaskId?: string
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  let parent: { id: string; depth: number; isDone: boolean; parentSubtaskId: string | null } | null = null;
  if (parentSubtaskId) {
    parent = await prisma.subtask.findFirst({
      where: { id: parentSubtaskId, taskItemId, organizationId },
      select: { id: true, depth: true, isDone: true, parentSubtaskId: true },
    });
    if (!parent) throw new Error('Parent subtask not found');
    if (parent.depth >= 2) throw new Error('Maximum subtask depth exceeded');
  }
  const depth = parent ? parent.depth + 1 : 0;

  const last = await prisma.subtask.findFirst({
    where: { taskItemId, organizationId, parentSubtaskId: parentSubtaskId ?? null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = last ? last.position.plus(1) : new Prisma.Decimal(1);

  await prisma.$transaction(async (tx) => {
    await tx.subtask.create({
      data: {
        organizationId,
        taskItemId,
        parentSubtaskId: parentSubtaskId ?? null,
        title,
        position,
        depth,
        createdById: actor.organizationUserId,
      },
    });

    if (parent) {
      await tx.subtask.update({
        where: { id: parent.id },
        data: {
          childTotal: { increment: 1 },
          ...(parent.isDone && {
            isDone: false,
            checkedById: null,
            checkedByNameSnapshot: null,
            checkedByAvatarSnapshot: null,
            checkedAt: null,
          }),
        },
      });

      // The parent was done and just flipped back to not-done — that undoes
      // one "done" count one level further up (grandparent or TaskItem).
      if (parent.isDone) {
        if (parent.parentSubtaskId) {
          await tx.subtask.update({
            where: { id: parent.parentSubtaskId },
            data: { childDone: { decrement: 1 } },
          });
        } else {
          await tx.taskItem.update({
            where: { id: taskItemId },
            data: { subtaskDone: { decrement: 1 } },
          });
        }
      }
    } else {
      await tx.taskItem.update({
        where: { id: taskItemId },
        data: { subtaskTotal: { increment: 1 } },
      });
    }

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        subtaskId: parentSubtaskId ?? undefined,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'SUBTASK_CREATED',
        taskItemTitleSnapshot: task.title,
        targetTitle: title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}

/**
 * @throws Error('Task not found')
 * @throws Error('Subtask not found')
 */
export async function renameSubtask(
  organizationId: string,
  taskItemId: string,
  subtaskId: string,
  title: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskItemId, organizationId },
    select: { id: true, title: true },
  });
  if (!subtask) throw new Error('Subtask not found');

  await prisma.$transaction(async (tx) => {
    await tx.subtask.update({
      where: { id: subtaskId },
      data: { title, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        subtaskId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'SUBTASK_RENAMED',
        taskItemTitleSnapshot: task.title,
        targetTitle: title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}

/**
 * Delete a subtask. Descendants are removed by the DB-level cascade on
 * `Subtask.parent`; this recomputes the immediate parent's and (if the
 * target is root) the TaskItem's counters beforehand.
 *
 * @throws Error('Task not found')
 * @throws Error('Subtask not found')
 */
export async function deleteSubtask(
  organizationId: string,
  taskItemId: string,
  subtaskId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskItemId, organizationId },
    select: { id: true, title: true, isDone: true, depth: true, parentSubtaskId: true },
  });
  if (!subtask) throw new Error('Subtask not found');

  await prisma.$transaction(async (tx) => {
    if (subtask.parentSubtaskId) {
      await tx.subtask.update({
        where: { id: subtask.parentSubtaskId },
        data: {
          childTotal: { decrement: 1 },
          ...(subtask.isDone && { childDone: { decrement: 1 } }),
        },
      });
    }

    if (subtask.depth === 0) {
      await tx.taskItem.update({
        where: { id: taskItemId },
        data: {
          subtaskTotal: { decrement: 1 },
          ...(subtask.isDone && { subtaskDone: { decrement: 1 } }),
        },
      });
    }

    // Descendant rows cascade-delete at the DB level (Subtask.parent onDelete: Cascade).
    await tx.subtask.delete({ where: { id: subtaskId } });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'SUBTASK_DELETED',
        taskItemTitleSnapshot: task.title,
        targetTitle: subtask.title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}

// ─────────────────────────────────────────────
// Tasks — trash lifecycle (soft delete, restore, permanent delete)
// ─────────────────────────────────────────────

/**
 * Move a task to the trash. It disappears from the board and every
 * task-mutation endpoint until restored.
 *
 * @throws Error('Task not found') — missing, or already in the trash
 */
export async function deleteTask(
  organizationId: string,
  taskItemId: string,
  actor: ActorInput
): Promise<{ id: string }> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskItemId },
      data: {
        deletedAt: new Date(),
        deletedById: actor.organizationUserId,
        version: { increment: 1 },
      },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_DELETED',
        taskItemTitleSnapshot: task.title,
      },
    });
  });

  return { id: taskItemId };
}

/**
 * Restore a task out of the trash.
 *
 * @throws Error('Task not found') — missing, or not currently trashed
 */
export async function restoreTask(
  organizationId: string,
  taskItemId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: { not: null } },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskItem.update({
      where: { id: taskItemId },
      data: { deletedAt: null, deletedById: null, version: { increment: 1 } },
    });

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_RESTORED',
        taskItemTitleSnapshot: task.title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}

/**
 * Permanently delete a task that is already in the trash. Descendants
 * (`Subtask`, `TaskAssignee`, `TaskItemBadge`) cascade-delete at the DB
 * level. The `TaskActivity` row for this event is written first, before the
 * row disappears — activity rows have no FK to TaskItem by design, so the
 * history survives.
 *
 * @throws Error('Task not found') — missing, or not currently trashed
 */
export async function permanentlyDeleteTask(
  organizationId: string,
  taskItemId: string,
  actor: ActorInput
): Promise<{ id: string }> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId, deletedAt: { not: null } },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_PURGED',
        taskItemTitleSnapshot: task.title,
      },
    });

    await tx.taskItem.delete({ where: { id: taskItemId } });
  });

  return { id: taskItemId };
}

/** List every trashed task in the organization, most recently deleted first. */
export async function listTrashedTasks(organizationId: string): Promise<TrashedTaskDto[]> {
  const rows = await prisma.taskItem.findMany({
    where: { organizationId, deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    select: {
      id: true,
      title: true,
      priority: true,
      deletedAt: true,
      group: { select: { name: true } },
      deletedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    priority: row.priority,
    groupName: row.group.name,
    deletedAt: row.deletedAt!.toISOString(),
    deletedByName: row.deletedBy ? `${row.deletedBy.firstName} ${row.deletedBy.lastName}`.trim() : 'Unknown',
  }));
}
