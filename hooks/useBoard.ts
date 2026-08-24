// hooks/useBoard.ts
// Fetches and mutates the Kanban board (/api/board). Not a flat paginated list
// (see useDataList for that shape), so this is a small dedicated hook built on
// the generic useMutation hook for the write calls.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type {
  BoardDto,
  BoardGroupDto,
  BoardTaskDto,
  TaskDetailDto,
  TaskPriority,
} from '@/types/planner';
import type { GroupColorKey } from '@/lib/shared/group-colors';

/** The column settings a caller may patch. Omitted keys stay untouched. */
export interface GroupPatch {
  name?: string;
  color?: GroupColorKey | null;
  wipLimit?: number | null;
}

export interface UseBoardReturn {
  board: BoardDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  moveTask: (taskId: string, groupId: string, targetIndex: number) => Promise<boolean>;
  /** `priority` omitted → the server applies the schema default (MEDIUM). */
  addTask: (groupId: string, title: string, priority?: TaskPriority) => Promise<boolean>;
  addGroup: (name: string, color?: GroupColorKey) => Promise<boolean>;
  updateGroup: (groupId: string, patch: GroupPatch) => Promise<boolean>;
  reorderGroups: (orderedGroupIds: string[]) => Promise<boolean>;
  /** Relocates the column's cards into `targetGroupId`, then deletes it. */
  deleteGroup: (
    groupId: string,
    targetGroupId: string
  ) => Promise<{ movedTaskCount: number } | null>;
  /** Merges a task edited elsewhere (e.g. the detail panel) into board state. */
  applyTaskUpdate: (task: TaskDetailDto) => void;
}

/**
 * @param planId Board to load. Omitted → the organization's default plan,
 *   which the API provisions on first use.
 */
export function useBoard(planId?: string): UseBoardReturn {
  const [board, setBoard] = useState<BoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useMutation();

  const hasLoadedRef = useRef(false);
  const boardRef = useRef<BoardDto | null>(null);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const fetchBoard = useCallback(async () => {
    try {
      // Only the cold load swaps in the skeleton. A background refresh keeps
      // the board (and any open task panel) mounted.
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);

      const response = await fetch(planId ? `/api/board?planId=${planId}` : '/api/board', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load board');
      }

      setBoard(data.data as BoardDto);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // Optimistically relocates a task within local state, then persists the
  // move; on failure it refetches to discard the optimistic change.
  const moveTask = useCallback(
    async (taskId: string, groupId: string, targetIndex: number) => {
      setBoard((prev) => {
        if (!prev) return prev;

        let moved: BoardTaskDto | undefined;
        const groups = prev.groups.map((group) => ({
          ...group,
          taskItems: group.taskItems.filter((task) => {
            if (task.id === taskId) {
              moved = task;
              return false;
            }
            return true;
          }),
        }));

        if (!moved) return prev;

        const nextGroups = groups.map((group) => {
          if (group.id !== groupId) return group;
          const taskItems = [...group.taskItems];
          taskItems.splice(targetIndex, 0, { ...moved!, groupId });
          return { ...group, taskItems };
        });

        return { ...prev, groups: nextGroups };
      });

      const result = await mutate<{ groupId: string; targetIndex: number }>(
        `/api/board/tasks/${taskId}/move`,
        { method: 'PATCH', body: { groupId, targetIndex } }
      );

      if (!result) {
        await fetchBoard();
        return false;
      }
      return true;
    },
    [mutate, fetchBoard]
  );

  const addTask = useCallback(
    async (groupId: string, title: string, priority?: TaskPriority) => {
      const created = await mutate<{ groupId: string; title: string; priority?: TaskPriority }>(
        '/api/board/tasks',
        { method: 'POST', body: { groupId, title, ...(priority && { priority }) } }
      );
      if (!created) return false;

      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map((group) =>
            group.id === groupId
              ? { ...group, taskItems: [...group.taskItems, created as BoardTaskDto] }
              : group
          ),
        };
      });
      return true;
    },
    [mutate]
  );

  const addGroup = useCallback(
    async (name: string, color?: GroupColorKey) => {
      const created = await mutate<{ name: string; color?: string }>(
        planId ? `/api/board/groups?planId=${planId}` : '/api/board/groups',
        { method: 'POST', body: { name, color } }
      );
      if (!created) return false;

      setBoard((prev) =>
        prev ? { ...prev, groups: [...prev.groups, created as BoardGroupDto] } : prev
      );
      return true;
    },
    [mutate, planId]
  );

  /**
   * Patches a column's settings locally first (keeping its cards), then
   * persists. On failure it refetches to discard — the same shape moveTask
   * uses.
   */
  const updateGroup = useCallback(
    async (groupId: string, patch: GroupPatch) => {
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              groups: prev.groups.map((group) =>
                group.id === groupId ? { ...group, ...patch } : group
              ),
            }
          : prev
      );

      const updated = await mutate<GroupPatch>(`/api/board/groups/${groupId}`, {
        method: 'PATCH',
        body: patch,
      });

      if (!updated) {
        await fetchBoard();
        return false;
      }
      return true;
    },
    [mutate, fetchBoard]
  );

  const reorderGroups = useCallback(
    async (orderedGroupIds: string[]) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const byId = new Map(prev.groups.map((group) => [group.id, group]));
        const groups = orderedGroupIds
          .map((id, index) => {
            const group = byId.get(id);
            return group ? { ...group, sortOrder: index } : null;
          })
          .filter((group): group is BoardGroupDto => group !== null);
        // Bail out rather than render a partial board if the ids don't line up.
        return groups.length === prev.groups.length ? { ...prev, groups } : prev;
      });

      const updated = await mutate<{ groupIds: string[] }>(
        planId ? `/api/board/groups/reorder?planId=${planId}` : '/api/board/groups/reorder',
        { method: 'PATCH', body: { groupIds: orderedGroupIds } }
      );

      if (!updated) {
        await fetchBoard();
        return false;
      }
      return true;
    },
    [mutate, fetchBoard, planId]
  );

  /**
   * Not optimistic: the server recomputes the relocated cards' positions, so a
   * local guess would drift. hasLoadedRef keeps the refetch skeleton-free.
   */
  const deleteGroup = useCallback(
    async (groupId: string, targetGroupId: string) => {
      const result = await mutate<{ targetGroupId: string }>(`/api/board/groups/${groupId}`, {
        method: 'DELETE',
        body: { targetGroupId },
      });
      if (!result) return null;

      await fetchBoard();
      return result as { movedTaskCount: number };
    },
    [mutate, fetchBoard]
  );

  /**
   * Folds a TaskDetailDto returned by a panel mutation back into board state.
   * Cheaper and far less disruptive than refetching /api/board, which used to
   * flash the skeleton and remount the very panel that triggered the edit.
   */
  const applyTaskUpdate = useCallback(
    (updated: TaskDetailDto) => {
      // Board cards are BoardTaskDto — drop the detail-only fields rather than
      // making every card carry a description, subtask tree and activity log
      // for the calendar/timeline views to memoize over.
      const { description: _d, subtasks: _s, activities: _a, ...card } = updated;

      const targetExists = boardRef.current?.groups.some((group) => group.id === card.groupId);
      if (!targetExists) {
        // Moved into a column this tab hasn't seen yet — a local patch would
        // make the card vanish, so fall back to a (silent) refetch.
        void fetchBoard();
        return;
      }

      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          groups: prev.groups.map((group) => {
            const without = group.taskItems.filter((task) => task.id !== card.id);

            if (group.id !== card.groupId) {
              // Untouched columns keep their identity so views can bail out.
              return without.length === group.taskItems.length ? group : { ...group, taskItems: without };
            }

            // `position` is a serialized Decimal using halved gaps (1, 0.5,
            // 1.5, …) — it must be compared numerically, since as strings
            // "10" sorts before "9".
            const taskItems = [...without, card].sort(
              (a, b) => Number(a.position) - Number(b.position)
            );
            return { ...group, taskItems };
          }),
        };
      });
    },
    [fetchBoard]
  );

  return {
    board,
    loading,
    error,
    refetch: fetchBoard,
    moveTask,
    addTask,
    addGroup,
    updateGroup,
    reorderGroups,
    deleteGroup,
    applyTaskUpdate,
  };
}
