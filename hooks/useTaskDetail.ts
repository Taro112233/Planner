// hooks/useTaskDetail.ts
// Fetches and mutates a single task's full detail (/api/board/tasks/[taskId]).
// Mirrors hooks/useBoard.ts's shape — one useMutation-backed function per
// action, each returning a boolean so callers decide how to surface failure
// (matches BoardPage's handleAddTask/handleAddColumn convention).
//
// Two things the naive version got wrong, both of which read to users as a
// full page reload:
//   1. every fetch flipped a single `loading` flag, so a post-mutation refresh
//      swapped the whole page for a skeleton — see fetchTask below;
//   2. a single `mutating` flag disabled every control at once. Pending state
//      is now tracked per section (TaskPendingScope).

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { BoardTaskDto, TaskDetailDto, TaskPriority } from '@/types/planner';

/**
 * The section a mutation belongs to. Deliberately coarse — one key per UI
 * section rather than per row/member, which is enough to keep unrelated
 * controls interactive without threading pending IDs through shared
 * components.
 */
export type TaskPendingScope =
  | 'title'
  | 'description'
  | 'priority'
  | 'dates'
  | 'status'
  | 'assignees'
  | 'subtasks'
  | 'delete';

export interface UseTaskDetailReturn {
  task: TaskDetailDto | null;
  loading: boolean;
  error: string | null;
  /** True while a mutation for that section is in flight. */
  isPending: (scope: TaskPendingScope) => boolean;
  /** Increments on every successful mutation — lets side panels refresh. */
  dataVersion: number;
  refetch: () => Promise<void>;
  updateTitle: (title: string) => Promise<boolean>;
  updateDescription: (description: string | null) => Promise<boolean>;
  updatePriority: (priority: TaskPriority) => Promise<boolean>;
  updateDates: (dates: { startDate: string | null; dueDate: string | null }) => Promise<boolean>;
  changeStatus: (groupId: string) => Promise<boolean>;
  assign: (organizationUserId: string) => Promise<boolean>;
  unassign: (organizationUserId: string) => Promise<boolean>;
  toggleSubtask: (subtaskId: string, desiredIsDone: boolean) => Promise<boolean>;
  addSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  renameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  deleteSubtask: (subtaskId: string) => Promise<boolean>;
  deleteTask: () => Promise<boolean>;
}

export function useTaskDetail(taskId: string): UseTaskDetailReturn {
  const [task, setTaskState] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ReadonlySet<TaskPendingScope>>(() => new Set());
  const [dataVersion, setDataVersion] = useState(0);
  const { mutate } = useMutation<TaskDetailDto>();

  /**
   * Mirror of `task` readable without adding it to callback dependencies —
   * `fetchTask` must stay keyed on `taskId` alone, or the mount effect below
   * would re-fire on every mutation.
   */
  const taskRef = useRef<TaskDetailDto | null>(null);

  const setTask = useCallback((next: TaskDetailDto | null) => {
    taskRef.current = next;
    setTaskState(next);
  }, []);

  // ───────────────────────────────────────────
  // Ordering guard
  //
  // Every mutation route returns the *whole* task, so two overlapping edits
  // race: a slow title response would otherwise revert a description saved
  // after it. Requests are numbered on issue, and a snapshot is dropped if a
  // newer one already landed. Also covers a background GET resolving after a
  // mutation, and a response arriving after the caller navigated away.
  // ───────────────────────────────────────────
  const seqRef = useRef(0);
  const appliedRef = useRef(0);

  const applySnapshot = useCallback(
    (seq: number, next: TaskDetailDto) => {
      if (seq < appliedRef.current) return;
      appliedRef.current = seq;
      setTask(next);
    },
    [setTask]
  );

  const beginScope = useCallback((scope: TaskPendingScope) => {
    setPending((prev) => new Set(prev).add(scope));
  }, []);

  const endScope = useCallback((scope: TaskPendingScope) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(scope);
      return next;
    });
  }, []);

  const isPending = useCallback((scope: TaskPendingScope) => pending.has(scope), [pending]);

  const fetchTask = useCallback(async () => {
    const seq = ++seqRef.current;
    try {
      // Show the skeleton only on a genuine cold load — first mount, or a
      // client-side navigation to a different task. Refreshing the task we
      // already display keeps the previous data on screen instead of
      // unmounting the whole page (which loses every in-progress edit).
      if (taskRef.current?.id !== taskId) setLoading(true);
      setError(null);

      const response = await fetch(`/api/board/tasks/${taskId}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to load task');
      }

      applySnapshot(seq, data.data as TaskDetailDto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, applySnapshot]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const run = useCallback(
    async <TBody>(
      scope: TaskPendingScope,
      endpoint: string,
      options: { method: 'PATCH' | 'POST' | 'DELETE'; body?: TBody }
    ) => {
      const seq = ++seqRef.current;
      beginScope(scope);
      try {
        const updated = await mutate<TBody>(endpoint, options);
        if (!updated) return false;
        applySnapshot(seq, updated);
        setDataVersion((version) => version + 1);
        return true;
      } finally {
        endScope(scope);
      }
    },
    [mutate, applySnapshot, beginScope, endScope]
  );

  const updateTitle = useCallback(
    (title: string) => run('title', `/api/board/tasks/${taskId}/title`, { method: 'PATCH', body: { title } }),
    [run, taskId]
  );

  const updateDescription = useCallback(
    (description: string | null) =>
      run('description', `/api/board/tasks/${taskId}/description`, {
        method: 'PATCH',
        body: { description },
      }),
    [run, taskId]
  );

  const updatePriority = useCallback(
    (priority: TaskPriority) =>
      run('priority', `/api/board/tasks/${taskId}/priority`, { method: 'PATCH', body: { priority } }),
    [run, taskId]
  );

  const updateDates = useCallback(
    (dates: { startDate: string | null; dueDate: string | null }) =>
      run('dates', `/api/board/tasks/${taskId}/dates`, { method: 'PATCH', body: dates }),
    [run, taskId]
  );

  /**
   * The move endpoint returns a BoardTaskDto — a strict subset of
   * TaskDetailDto's keys — so spreading it over the task we already hold gives
   * us the server's real groupId/position/updatedAt while keeping description,
   * subtasks and activities intact. No re-fetch, so no skeleton flash.
   */
  const changeStatus = useCallback(
    async (groupId: string) => {
      // Clicking the chip the task already sits on is a no-op — without this
      // it PATCHes and writes a spurious TASK_MOVED activity row.
      if (taskRef.current?.groupId === groupId) return true;

      const seq = ++seqRef.current;
      beginScope('status');
      try {
        const moved = await mutate<{ groupId: string; targetIndex: number }>(
          `/api/board/tasks/${taskId}/move`,
          { method: 'PATCH', body: { groupId, targetIndex: 0 } }
        );
        if (!moved) return false;

        const prev = taskRef.current;
        if (prev) applySnapshot(seq, { ...prev, ...(moved as BoardTaskDto) });
        setDataVersion((version) => version + 1);
        return true;
      } finally {
        endScope('status');
      }
    },
    [mutate, applySnapshot, beginScope, endScope, taskId]
  );

  const assign = useCallback(
    (organizationUserId: string) =>
      run('assignees', `/api/board/tasks/${taskId}/assignees`, {
        method: 'POST',
        body: { organizationUserId },
      }),
    [run, taskId]
  );

  const unassign = useCallback(
    (organizationUserId: string) =>
      run('assignees', `/api/board/tasks/${taskId}/assignees`, {
        method: 'DELETE',
        body: { organizationUserId },
      }),
    [run, taskId]
  );

  const toggleSubtask = useCallback(
    (subtaskId: string, desiredIsDone: boolean) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: { isDone: desiredIsDone },
      }),
    [run, taskId]
  );

  const addSubtask = useCallback(
    (title: string, parentSubtaskId?: string) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: { title, parentSubtaskId },
      }),
    [run, taskId]
  );

  const renameSubtask = useCallback(
    (subtaskId: string, title: string) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks/${subtaskId}/rename`, {
        method: 'PATCH',
        body: { title },
      }),
    [run, taskId]
  );

  const deleteSubtask = useCallback(
    (subtaskId: string) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    [run, taskId]
  );

  /**
   * Moves the task to the trash. There's no updated TaskDetailDto to store
   * afterward (the task is no longer active), so this bypasses `run()` —
   * the caller is expected to navigate away on success.
   */
  const deleteTask = useCallback(async () => {
    beginScope('delete');
    try {
      const result = await mutate(`/api/board/tasks/${taskId}`, { method: 'DELETE' });
      return !!result;
    } finally {
      endScope('delete');
    }
  }, [mutate, beginScope, endScope, taskId]);

  return {
    task,
    loading,
    error,
    isPending,
    dataVersion,
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
    deleteTask,
  };
}
