// lib/shared/subtask-tree.ts
// Pure operations on a task's subtask tree, shared by every optimistic update
// so the counter rules live in exactly one place.
//
// The counters follow prisma/Instruction-task.md: a parent tracks its DIRECT
// children (I4), TaskItem.subtaskTotal/Done counts root subtasks only (I6),
// and un-ticking clears the checker snapshot (I7).

import type { BoardTaskDto, SubtaskNodeDto } from '@/types/planner';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rebuild the tree with `patch` applied to the node with `subtaskId`. */
export function patchSubtaskTree(
  nodes: SubtaskNodeDto[],
  subtaskId: string,
  patch: (node: SubtaskNodeDto) => SubtaskNodeDto
): SubtaskNodeDto[] {
  return nodes.map((node) => {
    if (node.id === subtaskId) return patch(node);
    if (node.children.length === 0) return node;
    return { ...node, children: patchSubtaskTree(node.children, subtaskId, patch) };
  });
}

export function findSubtask(
  nodes: SubtaskNodeDto[],
  subtaskId: string,
  parent: SubtaskNodeDto | null = null
): { node: SubtaskNodeDto; parent: SubtaskNodeDto | null } | null {
  for (const node of nodes) {
    if (node.id === subtaskId) return { node, parent };
    const hit = findSubtask(node.children, subtaskId, node);
    if (hit) return hit;
  }
  return null;
}

/** Drop a node and, with it, its whole subtree — mirrors the DB cascade. */
export function removeSubtask(nodes: SubtaskNodeDto[], subtaskId: string): SubtaskNodeDto[] {
  return nodes
    .filter((node) => node.id !== subtaskId)
    .map((node) =>
      node.children.length === 0
        ? node
        : { ...node, children: removeSubtask(node.children, subtaskId) }
    );
}

/**
 * Flip one subtask and move the counters exactly as setSubtaskDone does: the
 * direct parent's childDone by one, and the TaskItem counter only for a root
 * subtask. No cascade — the service doesn't do one either.
 *
 * Returns the task unchanged when the node is missing or already in the
 * desired state, so a repeated click is a no-op rather than a double count.
 */
export function toggleSubtaskInTask<T extends BoardTaskDto>(
  task: T,
  subtaskId: string,
  desiredIsDone: boolean
): T {
  const found = findSubtask(task.subtasks, subtaskId);
  if (!found || found.node.isDone === desiredIsDone) return task;

  const delta = desiredIsDone ? 1 : -1;

  let subtasks = patchSubtaskTree(task.subtasks, subtaskId, (node) => ({
    ...node,
    isDone: desiredIsDone,
    // Attribution is server-stamped: cleared on uncheck (invariant I7), left
    // blank on check until the response lands.
    checkedByName: null,
    checkedByAvatarUrl: null,
    checkedAt: null,
  }));

  if (found.parent) {
    const parentId = found.parent.id;
    subtasks = patchSubtaskTree(subtasks, parentId, (node) => ({
      ...node,
      childDone: clamp(node.childDone + delta, 0, node.childTotal),
    }));
  }

  return {
    ...task,
    subtasks,
    subtaskDone:
      found.node.depth === 0
        ? clamp(task.subtaskDone + delta, 0, task.subtaskTotal)
        : task.subtaskDone,
  };
}

/**
 * Move a subtask to `targetIndex` under `parentSubtaskId`, carrying its
 * subtree. Mirrors moveSubtask on the server: depths shift by the same delta,
 * and the counters of the old and new parent (or the card, for root subtasks)
 * move with it.
 *
 * `parentSubtaskId` omitted keeps the current parent; `null` means the root.
 */
export function moveSubtaskInTask<T extends BoardTaskDto>(
  task: T,
  subtaskId: string,
  targetIndex: number,
  parentSubtaskId?: string | null
): T {
  const found = findSubtask(task.subtasks, subtaskId);
  if (!found) return task;

  const currentParentId = found.parent?.id ?? null;
  const targetParentId = parentSubtaskId === undefined ? currentParentId : parentSubtaskId;
  const node = found.node;

  // Detaching into its own subtree would drop that branch off the tree.
  if (targetParentId && findSubtask([node], targetParentId)) return task;

  const detached = removeSubtask(task.subtasks, subtaskId);

  const depthDelta =
    (targetParentId ? (findSubtask(detached, targetParentId)?.node.depth ?? 0) + 1 : 0) - node.depth;

  const shiftDepth = (target: SubtaskNodeDto): SubtaskNodeDto => ({
    ...target,
    depth: target.depth + depthDelta,
    children: target.children.map(shiftDepth),
  });
  const moved = depthDelta === 0 ? node : shiftDepth(node);

  const insert = (nodes: SubtaskNodeDto[]): SubtaskNodeDto[] => {
    const next = [...nodes];
    next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, moved);
    return next;
  };

  let subtasks =
    targetParentId === null
      ? insert(detached)
      : patchSubtaskTree(detached, targetParentId, (parent) => ({
          ...parent,
          children: insert(parent.children),
          childTotal: parent.childTotal + 1,
          childDone: parent.childDone + (node.isDone ? 1 : 0),
        }));

  if (currentParentId !== targetParentId && currentParentId) {
    subtasks = patchSubtaskTree(subtasks, currentParentId, (parent) => ({
      ...parent,
      childTotal: Math.max(0, parent.childTotal - 1),
      childDone: Math.max(0, parent.childDone - (node.isDone ? 1 : 0)),
    }));
  }

  // The card's counters track root subtasks only (invariant I6), so they move
  // only when the node enters or leaves the root level.
  let subtaskTotal = task.subtaskTotal;
  let subtaskDone = task.subtaskDone;
  if (currentParentId !== targetParentId) {
    if (currentParentId === null) {
      subtaskTotal = Math.max(0, subtaskTotal - 1);
      if (node.isDone) subtaskDone = Math.max(0, subtaskDone - 1);
    }
    if (targetParentId === null) {
      subtaskTotal += 1;
      if (node.isDone) subtaskDone += 1;
    }
  }

  return { ...task, subtasks, subtaskTotal, subtaskDone };
}
