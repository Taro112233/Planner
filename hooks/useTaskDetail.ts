// hooks/useTaskDetail.ts
// Fetches and mutates a single task's full detail (/api/board/tasks/[taskId]).
// Mirrors hooks/useBoard.ts's shape — one useMutation-backed function per
// action, each returning a boolean so callers decide how to surface failure
// (matches BoardPage's handleAddTask/handleAddColumn convention).

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { TaskDetailDto, TaskPriority } from '@/types/planner';

export interface UseTaskDetailReturn {
  task: TaskDetailDto | null;
  loading: boolean;
  error: string | null;
  mutating: boolean;
  refetch: () => Promise<void>;
  updateTitle: (title: string) => Promise<boolean>;
  updateDescription: (description: string | null) => Promise<boolean>;
  updatePriority: (priority: TaskPriority) => Promise<boolean>;
  updateDates: (dates: { startDate: string | null; dueDate: string | null }) => Promise<boolean>;
  changeStatus: (groupId: string) => Promise<boolean>;
  assign: (organizationUserId: string) => Promise<boolean>;
  unassign: (organizationUserId: string) => Promise<boolean>;
  toggleSubtask: (subtaskId: string) => Promise<boolean>;
  addSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  renameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  deleteSubtask: (subtaskId: string) => Promise<boolean>;
}

export function useTaskDetail(taskId: string): UseTaskDetailReturn {
  const [task, setTask] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate, loading: mutating } = useMutation<TaskDetailDto>();

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/board/tasks/${taskId}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load task');
      }

      setTask(data.data as TaskDetailDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const run = useCallback(
    async <TBody>(endpoint: string, options: { method: 'PATCH' | 'POST' | 'DELETE'; body?: TBody }) => {
      const updated = await mutate<TBody>(endpoint, options);
      if (!updated) return false;
      setTask(updated);
      return true;
    },
    [mutate]
  );

  const updateTitle = useCallback(
    (title: string) => run(`/api/board/tasks/${taskId}/title`, { method: 'PATCH', body: { title } }),
    [run, taskId]
  );

  const updateDescription = useCallback(
    (description: string | null) =>
      run(`/api/board/tasks/${taskId}/description`, { method: 'PATCH', body: { description } }),
    [run, taskId]
  );

  const updatePriority = useCallback(
    (priority: TaskPriority) =>
      run(`/api/board/tasks/${taskId}/priority`, { method: 'PATCH', body: { priority } }),
    [run, taskId]
  );

  const updateDates = useCallback(
    (dates: { startDate: string | null; dueDate: string | null }) =>
      run(`/api/board/tasks/${taskId}/dates`, { method: 'PATCH', body: dates }),
    [run, taskId]
  );

  /**
   * The move endpoint returns a BoardTaskDto (no description/subtasks/activities),
   * so re-fetch the full detail afterwards rather than trusting its response shape
   * (same quirk TaskDetailModal's patchMove works around).
   */
  const changeStatus = useCallback(
    async (groupId: string) => {
      const moved = await mutate(`/api/board/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: { groupId, targetIndex: 0 },
      });
      if (!moved) return false;
      await fetchTask();
      return true;
    },
    [mutate, fetchTask, taskId]
  );

  const assign = useCallback(
    (organizationUserId: string) =>
      run(`/api/board/tasks/${taskId}/assignees`, { method: 'POST', body: { organizationUserId } }),
    [run, taskId]
  );

  const unassign = useCallback(
    (organizationUserId: string) =>
      run(`/api/board/tasks/${taskId}/assignees`, { method: 'DELETE', body: { organizationUserId } }),
    [run, taskId]
  );

  const toggleSubtask = useCallback(
    (subtaskId: string) => run(`/api/board/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'PATCH' }),
    [run, taskId]
  );

  const addSubtask = useCallback(
    (title: string, parentSubtaskId?: string) =>
      run(`/api/board/tasks/${taskId}/subtasks`, { method: 'POST', body: { title, parentSubtaskId } }),
    [run, taskId]
  );

  const renameSubtask = useCallback(
    (subtaskId: string, title: string) =>
      run(`/api/board/tasks/${taskId}/subtasks/${subtaskId}/rename`, { method: 'PATCH', body: { title } }),
    [run, taskId]
  );

  const deleteSubtask = useCallback(
    (subtaskId: string) => run(`/api/board/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    [run, taskId]
  );

  return {
    task,
    loading,
    error,
    mutating,
    refetch: fetchTask,
    updateTitle,
    updateDescription,
    updatePriority,
    updateDates,
    changeStatus,
    assign,
    unassign,
    toggleSubtask,
    addSubtask,
    renameSubtask,
    deleteSubtask,
  };
}
