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
  SubtaskNodeDto,
  TaskDetailDto,
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

// ─────────────────────────────────────────────
// Tasks (cards)
// ─────────────────────────────────────────────

/**
 * @throws Error('Group not found')
 */
export async function createTask(
  organizationId: string,
  groupId: string,
  title: string,
  actor: ActorInput
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
    where: { id: taskId, organizationId },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const group = await prisma.group.findFirst({
    where: { id: targetGroupId, organizationId },
    select: { id: true },
  });
  if (!group) throw new Error('Group not found');

  const siblings = await prisma.taskItem.findMany({
    where: { organizationId, groupId: targetGroupId, id: { not: taskId } },
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

/**
 * @throws Error('Task not found')
 */
export async function getTaskDetail(
  organizationId: string,
  taskId: string
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskId, organizationId },
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
      select: {
        id: true,
        parentSubtaskId: true,
        title: true,
        isDone: true,
        depth: true,
        childTotal: true,
        childDone: true,
      },
    }),
    prisma.taskActivity.findMany({
      where: { taskItemId: task.id, organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, action: true, actorNameSnapshot: true, targetTitle: true, createdAt: true },
    }),
  ]);

  return {
    ...serializeBoardTask(task),
    description: task.description,
    subtasks: buildSubtaskTree(subtaskRows),
    activities: activityRows.map((a) => ({
      id: a.id,
      action: a.action,
      actorNameSnapshot: a.actorNameSnapshot,
      targetTitle: a.targetTitle,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

// ─────────────────────────────────────────────
// Subtasks
// ─────────────────────────────────────────────

/**
 * @throws Error('Task not found')
 * @throws Error('Subtask not found')
 */
export async function toggleSubtask(
  organizationId: string,
  taskItemId: string,
  subtaskId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskItemId, organizationId },
    select: { id: true, isDone: true, depth: true, parentSubtaskId: true },
  });
  if (!subtask) throw new Error('Subtask not found');

  const nextIsDone = !subtask.isDone;

  await prisma.$transaction(async (tx) => {
    await tx.subtask.update({
      where: { id: subtaskId },
      data: {
        isDone: nextIsDone,
        checkedById: nextIsDone ? actor.organizationUserId : null,
        checkedByNameSnapshot: nextIsDone ? actor.name : null,
        checkedByAvatarSnapshot: nextIsDone ? actor.avatarUrl : null,
        checkedAt: nextIsDone ? new Date() : null,
        version: { increment: 1 },
      },
    });

    if (subtask.parentSubtaskId) {
      await tx.subtask.update({
        where: { id: subtask.parentSubtaskId },
        data: { childDone: { increment: nextIsDone ? 1 : -1 } },
      });
    }

    if (subtask.depth === 0) {
      await tx.taskItem.update({
        where: { id: taskItemId },
        data: { subtaskDone: { increment: nextIsDone ? 1 : -1 } },
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
        action: nextIsDone ? 'SUBTASK_CHECKED' : 'SUBTASK_UNCHECKED',
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
    where: { id: taskId, organizationId },
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
    where: { id: taskId, organizationId },
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
 * Add a root-level subtask (depth 0). Nested (child) subtask creation is not
 * yet exposed — the recursive tree is currently populated by seed/import data.
 *
 * @throws Error('Task not found')
 */
export async function addSubtask(
  organizationId: string,
  taskItemId: string,
  title: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const task = await prisma.taskItem.findFirst({
    where: { id: taskItemId, organizationId },
    select: { id: true, title: true },
  });
  if (!task) throw new Error('Task not found');

  const last = await prisma.subtask.findFirst({
    where: { taskItemId, organizationId, parentSubtaskId: null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = last ? last.position.plus(1) : new Prisma.Decimal(1);

  await prisma.$transaction(async (tx) => {
    await tx.subtask.create({
      data: {
        organizationId,
        taskItemId,
        title,
        position,
        depth: 0,
        createdById: actor.organizationUserId,
      },
    });

    await tx.taskItem.update({
      where: { id: taskItemId },
      data: { subtaskTotal: { increment: 1 } },
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
        action: 'SUBTASK_CREATED',
        taskItemTitleSnapshot: task.title,
        targetTitle: title,
      },
    });
  });

  return getTaskDetail(organizationId, taskItemId);
}
