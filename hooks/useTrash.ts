// hooks/useTrash.ts
// Fetches the organization's trashed tasks (/api/board/trash) and exposes
// restore / permanent-delete actions, removing the affected row from local
// state on success. Mirrors useBoardGroups.ts's fetch shape plus a
// useMutation-backed action per verb, matching useTaskDetail.ts's convention.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { TrashedTaskDto } from '@/types/planner';

export interface UseTrashReturn {
  tasks: TrashedTaskDto[];
  loading: boolean;
  error: string | null;
  mutating: boolean;
  refetch: () => Promise<void>;
  restoreTask: (taskId: string) => Promise<boolean>;
  permanentlyDeleteTask: (taskId: string) => Promise<boolean>;
}

export function useTrash(): UseTrashReturn {
  const [tasks, setTasks] = useState<TrashedTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate, loading: mutating } = useMutation();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/board/trash', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load trash');
      }

      setTasks(data.data as TrashedTaskDto[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const restoreTask = useCallback(
    async (taskId: string) => {
      const result = await mutate(`/api/board/tasks/${taskId}/restore`, { method: 'PATCH' });
      if (!result) return false;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return true;
    },
    [mutate]
  );

  const permanentlyDeleteTask = useCallback(
    async (taskId: string) => {
      const result = await mutate(`/api/board/tasks/${taskId}/permanent`, { method: 'DELETE' });
      if (!result) return false;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return true;
    },
    [mutate]
  );

  return { tasks, loading, error, mutating, refetch: fetchTasks, restoreTask, permanentlyDeleteTask };
}
