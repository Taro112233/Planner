// hooks/useBoard.ts
// Fetches and mutates the Kanban board (/api/board). Not a flat paginated list
// (see useDataList for that shape), so this is a small dedicated hook built on
// the generic useMutation hook for the write calls.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { BoardDto, BoardGroupDto, BoardTaskDto } from '@/types/planner';

export interface UseBoardReturn {
  board: BoardDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  moveTask: (taskId: string, groupId: string, targetIndex: number) => Promise<boolean>;
  addTask: (groupId: string, title: string) => Promise<boolean>;
  addGroup: (name: string, color?: string) => Promise<boolean>;
}

export function useBoard(): UseBoardReturn {
  const [board, setBoard] = useState<BoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useMutation();

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/board', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load board');
      }

      setBoard(data.data as BoardDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, []);

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
    async (groupId: string, title: string) => {
      const created = await mutate<{ groupId: string; title: string }>('/api/board/tasks', {
        method: 'POST',
        body: { groupId, title },
      });
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
    async (name: string, color?: string) => {
      const created = await mutate<{ name: string; color?: string }>('/api/board/groups', {
        method: 'POST',
        body: { name, color },
      });
      if (!created) return false;

      setBoard((prev) =>
        prev ? { ...prev, groups: [...prev.groups, created as BoardGroupDto] } : prev
      );
      return true;
    },
    [mutate]
  );

  return { board, loading, error, refetch: fetchBoard, moveTask, addTask, addGroup };
}
