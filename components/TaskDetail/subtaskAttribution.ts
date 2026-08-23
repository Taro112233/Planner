// components/TaskDetail/subtaskAttribution.ts
// Pure helpers shared by the slide-over and the full task page: subtask tree
// arithmetic plus the "who ticked what last" lookup behind LastCheckedBanner.

import type { SubtaskNodeDto } from '@/types/planner';

/** Two-letter avatar fallback from a display name ("Ada Lovelace" → "AL"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '?';
}

/**
 * Total nodes in the tree, all depths.
 *
 * Deliberately not the same number as TaskItem.subtaskTotal, which counts only
 * root subtasks (prisma/Instruction-task.md invariant I6). The progress bar
 * wants every level; the board card's counter wants the roots.
 */
export function countSubtasks(subtasks: SubtaskNodeDto[]): number {
  return subtasks.reduce((acc, s) => acc + 1 + countSubtasks(s.children), 0);
}

/** Done nodes in the tree, all depths. Same caveat as countSubtasks. */
export function countCompleted(subtasks: SubtaskNodeDto[]): number {
  return subtasks.reduce((acc, s) => acc + (s.isDone ? 1 : 0) + countCompleted(s.children), 0);
}

/**
 * The most recently ticked node anywhere in the tree, or null if nobody has
 * ticked anything. Only currently-done nodes carry a checkedAt — unchecking
 * clears it (invariant I7) — so this reports live state, not history.
 */
export function findLatestChecked(subtasks: SubtaskNodeDto[]): SubtaskNodeDto | null {
  let latest: SubtaskNodeDto | null = null;

  const visit = (nodes: SubtaskNodeDto[]) => {
    nodes.forEach((node) => {
      if (node.checkedAt && (!latest?.checkedAt || node.checkedAt > latest.checkedAt)) {
        latest = node;
      }
      visit(node.children);
    });
  };
  visit(subtasks);

  return latest;
}
