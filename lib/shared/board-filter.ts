// lib/shared/board-filter.ts
// The board toolbar's "ตัวกรอง" and "เรียง": a pure view over a BoardDto.
// It never changes the board data — the card order stored on the server
// (position) stays the source of truth, and drag-and-drop is switched off
// while a filter or a non-manual sort is showing.

import type { BoardDto, BoardTaskDto, TaskPriority } from '@/types/planner';

export type BoardSortKey = 'manual' | 'due' | 'priority' | 'title';

export interface BoardFilterState {
  priorities: TaskPriority[];
  /** Only cards assigned to this member; null for everyone's. */
  assigneeId: string | null;
  sort: BoardSortKey;
}

export const EMPTY_BOARD_FILTER: BoardFilterState = { priorities: [], assigneeId: null, sort: 'manual' };

export const BOARD_SORT_LABELS: Record<BoardSortKey, string> = {
  manual: 'ตามลำดับบนบอร์ด',
  due: 'กำหนดส่งใกล้สุด',
  priority: 'ความสำคัญสูงสุด',
  title: 'ชื่องาน ก–ฮ',
};

const PRIORITY_RANK: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** How many filters are on (the sort is not a filter). */
export function activeFilterCount(state: BoardFilterState): number {
  return (state.priorities.length > 0 ? 1 : 0) + (state.assigneeId ? 1 : 0);
}

/** True when the view differs from the stored board, so dragging must stop. */
export function isBoardViewAltered(state: BoardFilterState): boolean {
  return activeFilterCount(state) > 0 || state.sort !== 'manual';
}

function compare(sort: BoardSortKey): ((a: BoardTaskDto, b: BoardTaskDto) => number) | null {
  switch (sort) {
    case 'due':
      // Undated cards last.
      return (a, b) =>
        (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity);
    case 'priority':
      return (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case 'title':
      return (a, b) => a.title.localeCompare(b.title, 'th');
    default:
      return null;
  }
}

export function applyBoardFilter(board: BoardDto, state: BoardFilterState): BoardDto {
  if (!isBoardViewAltered(state)) return board;

  const byPriority = new Set(state.priorities);
  const order = compare(state.sort);

  return {
    ...board,
    groups: board.groups.map((group) => {
      let tasks = group.taskItems.filter(
        (task) =>
          (byPriority.size === 0 || byPriority.has(task.priority)) &&
          (!state.assigneeId ||
            task.assignees.some((assignee) => assignee.organizationUserId === state.assigneeId))
      );
      // Array.prototype.sort is stable, so equal keys keep the board order.
      if (order) tasks = [...tasks].sort(order);
      return { ...group, taskItems: tasks };
    }),
  };
}
