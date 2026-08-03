// services/task.service.ts
// Task Service — Layer 2 (Business Logic + Database)
// Covers: subtask toggle with audit logging.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/prisma';
import type { SubtaskProps, TaskDto } from '@/types/planner';
import type { Prisma } from '@prisma/client';

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Recursively traverse the subtask tree and toggle the `isCompleted`
 * flag of the node whose `id` matches `targetId`.
 *
 * Returns a new tree (immutable — does not mutate the input array).
 * Returns `null` if the target was not found anywhere in the tree.
 *
 * @example
 * const next = findAndToggleSubtask(subtasks, 'abc-123')
 * if (next === null) throw new Error('Subtask not found')
 */
export function findAndToggleSubtask(
  subtasks: SubtaskProps[],
  targetId: string
): SubtaskProps[] | null {
  let found = false;

  function traverse(nodes: SubtaskProps[]): SubtaskProps[] {
    return nodes.map((node) => {
      // Found the target — toggle and mark found
      if (node.id === targetId) {
        found = true;
        return { ...node, isCompleted: !node.isCompleted };
      }

      // Recurse into children if present
      if (node.children && node.children.length > 0) {
        const newChildren = traverse(node.children);
        return { ...node, children: newChildren };
      }

      return node;
    });
  }

  const result = traverse(subtasks);
  return found ? result : null;
}

/**
 * Parse `Task.subtasks` from Prisma's `JsonValue` into a typed array.
 * Falls back to an empty array if the value is null / not an array.
 */
function parseSubtasks(raw: Prisma.JsonValue): SubtaskProps[] {
  if (!Array.isArray(raw)) return [];
  return raw as unknown as SubtaskProps[];
}

// ─────────────────────────────────────────────
// Shared Prisma select
// ─────────────────────────────────────────────

const TASK_SELECT = {
  id:             true,
  organizationId: true,
  groupId:        true,
  title:          true,
  description:    true,
  status:         true,
  priority:       true,
  subtasks:       true,
  planDetails:    true,
  dueDate:        true,
  assigneeId:     true,
  createdById:    true,
  createdAt:      true,
  updatedAt:      true,
} as const;

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Toggle the `isCompleted` state of a subtask inside a Task.
 *
 * The function:
 *   1. Fetches the Task, scoped strictly to `organizationId`.
 *   2. Parses and recursively searches the `subtasks` JSON tree.
 *   3. Updates `Task.subtasks` and creates an `Audit` record atomically
 *      inside a single `prisma.$transaction()`.
 *
 * @throws Error('Task not found')    — task doesn't exist or belongs to another org
 * @throws Error('Subtask not found') — subtaskId is not present in the tree
 *
 * @returns The updated Task data (typed as TaskDto).
 */
export async function toggleSubtask(
  taskId:         string,
  subtaskId:      string,
  userId:         string,
  organizationId: string
): Promise<TaskDto> {
  // ── 1. Fetch task (tenant-scoped) ──────────────────────────────────
  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId },
    select: TASK_SELECT,
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // ── 2. Parse subtasks and find/toggle target ───────────────────────
  const currentSubtasks = parseSubtasks(task.subtasks);
  const updatedSubtasks = findAndToggleSubtask(currentSubtasks, subtaskId);

  if (updatedSubtasks === null) {
    throw new Error('Subtask not found');
  }

  // Determine the new completion state for the audit payload
  const wasCompleted = findCompletionState(currentSubtasks, subtaskId);

  // ── 3. Update task + create audit in one transaction ──────────────
  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where:  { id: taskId },
      data:   { subtasks: updatedSubtasks as unknown as Prisma.InputJsonValue },
      select: TASK_SELECT,
    }),
    prisma.audit.create({
      data: {
        organizationId,
        taskId,
        userId,
        entityType: 'task',
        action:     'SUBTASK_TOGGLED',
        payload:    {
          subtaskId,
          wasCompleted,
          isNowCompleted: !wasCompleted,
        } satisfies Prisma.InputJsonValue,
      },
    }),
  ]);

  return serializeTask(updatedTask);
}

// ─────────────────────────────────────────────
// Private utilities
// ─────────────────────────────────────────────

/**
 * Find the current `isCompleted` value of a subtask by ID.
 * Returns `false` if the node is not found (safe fallback for audit payload).
 */
function findCompletionState(subtasks: SubtaskProps[], targetId: string): boolean {
  for (const node of subtasks) {
    if (node.id === targetId) return node.isCompleted;
    if (node.children && node.children.length > 0) {
      const childResult = findCompletionState(node.children, targetId);
      // If found in children (non-default result), return it
      if (childResult !== false || node.children.some((c) => c.id === targetId)) {
        return childResult;
      }
    }
  }
  return false;
}

/**
 * Convert a raw Prisma Task record into a fully-typed TaskDto,
 * replacing Prisma `JsonValue` fields with their typed equivalents.
 */
function serializeTask(
  task: Awaited<ReturnType<typeof prisma.task.update>>
): TaskDto {
  return {
    id:             task.id,
    organizationId: task.organizationId,
    groupId:        task.groupId,
    title:          task.title,
    description:    task.description,
    status:         task.status,
    priority:       task.priority,
    subtasks:       parseSubtasks(task.subtasks),
    planDetails:    task.planDetails as TaskDto['planDetails'],
    dueDate:        task.dueDate?.toISOString() ?? null,
    assigneeId:     task.assigneeId,
    createdById:    task.createdById,
    createdAt:      task.createdAt.toISOString(),
    updatedAt:      task.updatedAt.toISOString(),
  };
}
