// hooks/useTrash.ts
// Fetches trashed tasks (/api/board/trash — the workspace or one group's) and exposes
// restore / permanent-delete actions, removing the affected row from local
// state on success. Mirrors useBoardGroups.ts's fetch shape plus a
// useMutation-backed action per verb, matching useTaskDetail.ts's convention.

'use client';

import { useCallback } from 'react';
import { invalidateApiResource, useApiResource } from '@/hooks/useApiResource';
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

/** @param scopeQuery  `planGroupId=…` to list one group's trash, or ''. */
export function useTrash(scopeQuery = ''): UseTrashReturn {
  const endpoint = scopeQuery ? `/api/board/trash?${scopeQuery}` : '/api/board/trash';
  const { data, loading, error, refetch, setData } = useApiResource<TrashedTaskDto[]>(endpoint);
  const { mutate, loading: mutating } = useMutation();

  const removeRow = useCallback(
    (taskId: string) => setData((current) => (current ?? []).filter((t) => t.id !== taskId)),
    [setData]
  );

  const restoreTask = useCallback(
    async (taskId: string) => {
      const result = await mutate(`/api/board/tasks/${taskId}/restore`, { method: 'PATCH' });
      if (!result) return false;
      removeRow(taskId);
      // The card is back on a board; boards and home must not show stale copies.
      invalidateApiResource('/api/home');
      invalidateApiResource('/api/my-tasks');
      return true;
    },
    [mutate, removeRow]
  );

  const permanentlyDeleteTask = useCallback(
    async (taskId: string) => {
      const result = await mutate(`/api/board/tasks/${taskId}/permanent`, { method: 'DELETE' });
      if (!result) return false;
      removeRow(taskId);
      return true;
    },
    [mutate, removeRow]
  );

  return {
    tasks: data ?? [],
    loading,
    error,
    mutating,
    refetch,
    restoreTask,
    permanentlyDeleteTask,
  };
}
