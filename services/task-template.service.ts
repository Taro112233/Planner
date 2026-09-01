// services/task-template.service.ts
// Task Template Service — Layer 2 (Business Logic + Database)
// Saved task shapes: name, title, priority and a nested checklist, stamped out
// as a real card on demand.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import type { ActorInput } from '@/services/board.service';
import { getTaskDetail } from '@/services/board.service';
import type {
  TaskDetailDto,
  TaskPriority,
  TaskTemplateDto,
  TaskTemplateNode,
} from '@/types/planner';

const DUPLICATE_ENTRY = 'Duplicate entry';
const TEMPLATE_NOT_FOUND = 'Template not found';
const GROUP_NOT_FOUND = 'Group not found';

/** Matches the Subtask tree's hard limit (prisma/Instruction-task.md I2). */
const MAX_TEMPLATE_DEPTH = 2;

const TEMPLATE_SELECT = {
  id: true,
  name: true,
  title: true,
  priority: true,
  subtasks: true,
  sortOrder: true,
} satisfies Prisma.TaskTemplateSelect;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * Read the blueprint back out of JSON, dropping anything malformed or too
 * deep. The column is untyped at the DB level, so nothing downstream should
 * assume it is well formed.
 */
function parseNodes(value: Prisma.JsonValue | null, depth = 0): TaskTemplateNode[] {
  if (depth > MAX_TEMPLATE_DEPTH || !Array.isArray(value)) return [];

  return value.flatMap((entry): TaskTemplateNode[] => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, Prisma.JsonValue>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) return [];

    return [{ title, children: parseNodes(record.children ?? null, depth + 1) }];
  });
}

/** Normalise on the way in so the stored JSON is always the shape we read. */
function serializeNodes(nodes: TaskTemplateNode[], depth = 0): TaskTemplateNode[] {
  if (depth > MAX_TEMPLATE_DEPTH) return [];

  return nodes
    .map((node) => ({ title: node.title.trim(), children: serializeNodes(node.children ?? [], depth + 1) }))
    .filter((node) => node.title.length > 0);
}

/** The blueprint is plain JSON; the cast only satisfies Prisma's input type. */
function toJson(nodes: TaskTemplateNode[]): Prisma.InputJsonValue {
  return nodes as unknown as Prisma.InputJsonValue;
}

function serializeTemplate(row: {
  id: string;
  name: string;
  title: string;
  priority: TaskPriority;
  subtasks: Prisma.JsonValue | null;
  sortOrder: number;
}): TaskTemplateDto {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    priority: row.priority,
    subtasks: parseNodes(row.subtasks),
    sortOrder: row.sortOrder,
  };
}

export async function listTaskTemplates(organizationId: string): Promise<TaskTemplateDto[]> {
  const rows = await prisma.taskTemplate.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: TEMPLATE_SELECT,
  });
  return rows.map(serializeTemplate);
}

/**
 * @throws Error('Duplicate entry') — a template with this name already exists
 */
export async function createTaskTemplate(
  organizationId: string,
  input: {
    name: string;
    title: string;
    priority?: TaskPriority;
    subtasks?: TaskTemplateNode[];
  },
  createdById?: string
): Promise<TaskTemplateDto> {
  const last = await prisma.taskTemplate.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  try {
    const created = await prisma.taskTemplate.create({
      data: {
        organizationId,
        name: input.name,
        title: input.title,
        ...(input.priority ? { priority: input.priority } : {}),
        subtasks: toJson(serializeNodes(input.subtasks ?? [])),
        sortOrder: (last?.sortOrder ?? -1) + 1,
        createdById,
      },
      select: TEMPLATE_SELECT,
    });
    return serializeTemplate(created);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/**
 * @throws Error('Template not found')
 * @throws Error('Duplicate entry')
 */
export async function updateTaskTemplate(
  organizationId: string,
  templateId: string,
  patch: {
    name?: string;
    title?: string;
    priority?: TaskPriority;
    subtasks?: TaskTemplateNode[];
  }
): Promise<TaskTemplateDto> {
  const existing = await prisma.taskTemplate.findFirst({
    where: { id: templateId, organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error(TEMPLATE_NOT_FOUND);

  const data: Prisma.TaskTemplateUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.priority !== undefined) data.priority = patch.priority;
  if (patch.subtasks !== undefined) data.subtasks = toJson(serializeNodes(patch.subtasks));

  try {
    const updated = await prisma.taskTemplate.update({
      where: { id: templateId },
      data,
      select: TEMPLATE_SELECT,
    });
    return serializeTemplate(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error(DUPLICATE_ENTRY);
    throw error;
  }
}

/**
 * @throws Error('Template not found')
 */
export async function deleteTaskTemplate(
  organizationId: string,
  templateId: string
): Promise<{ id: string }> {
  const existing = await prisma.taskTemplate.findFirst({
    where: { id: templateId, organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error(TEMPLATE_NOT_FOUND);

  await prisma.taskTemplate.delete({ where: { id: templateId } });
  return { id: templateId };
}

/**
 * Stamp a template out as a real card: the TaskItem plus its whole checklist,
 * counters included, in one transaction.
 *
 * Written here rather than by calling addSubtask in a loop — that would open a
 * transaction per node and recompute counters each time, and a half-created
 * card is worse than none.
 *
 * @throws Error('Template not found')
 * @throws Error('Group not found')
 */
export async function createTaskFromTemplate(
  organizationId: string,
  groupId: string,
  templateId: string,
  actor: ActorInput
): Promise<TaskDetailDto> {
  const template = await prisma.taskTemplate.findFirst({
    where: { id: templateId, organizationId },
    select: TEMPLATE_SELECT,
  });
  if (!template) throw new Error(TEMPLATE_NOT_FOUND);

  const group = await prisma.group.findFirst({
    where: { id: groupId, organizationId },
    select: { id: true, planId: true, plan: { select: { name: true } } },
  });
  if (!group) throw new Error(GROUP_NOT_FOUND);

  const nodes = parseNodes(template.subtasks);
  const last = await prisma.taskItem.findFirst({
    where: { organizationId, groupId, deletedAt: null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const taskId = await prisma.$transaction(async (tx) => {
    const task = await tx.taskItem.create({
      data: {
        organizationId,
        groupId,
        title: template.title,
        priority: template.priority,
        position: last ? last.position.plus(1) : new Prisma.Decimal(1),
        createdById: actor.organizationUserId,
        // Only root nodes count toward the card's totals (invariant I6).
        subtaskTotal: nodes.length,
      },
      select: { id: true },
    });

    // Depth-first so a parent always exists before its children reference it.
    const createLevel = async (
      level: TaskTemplateNode[],
      parentSubtaskId: string | null,
      depth: number
    ): Promise<void> => {
      for (let index = 0; index < level.length; index += 1) {
        const node = level[index];
        const created = await tx.subtask.create({
          data: {
            organizationId,
            taskItemId: task.id,
            parentSubtaskId,
            title: node.title,
            depth,
            position: new Prisma.Decimal(index + 1),
            createdById: actor.organizationUserId,
            childTotal: node.children.length,
          },
          select: { id: true },
        });

        if (node.children.length > 0 && depth < MAX_TEMPLATE_DEPTH) {
          await createLevel(node.children, created.id, depth + 1);
        }
      }
    };

    await createLevel(nodes, null, 0);

    await tx.taskActivity.create({
      data: {
        organizationId,
        taskItemId: task.id,
        planId: group.planId,
        planNameSnapshot: group.plan?.name ?? null,
        actorId: actor.organizationUserId,
        actorUserIdSnapshot: actor.userId,
        actorNameSnapshot: actor.name,
        actorAvatarSnapshot: actor.avatarUrl,
        actorRoleSnapshot: actor.role,
        action: 'TASK_CREATED',
        taskItemTitleSnapshot: template.title,
        changes: { fromTemplate: template.name, subtaskCount: nodes.length },
      },
    });

    return task.id;
  });

  return getTaskDetail(organizationId, taskId);
}
