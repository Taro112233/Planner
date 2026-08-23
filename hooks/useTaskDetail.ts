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
//      is now tracked per section (TaskPendingScope);
//   3. every edit waited for the server before anything moved on screen, so a
//      status chip click read as a freeze. Mutations now paint the expected
//      result immediately and reconcile with the server response — see `run`.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { BoardTaskDto, SubtaskNodeDto, TaskDetailDto, TaskPriority } from '@/types/planner';

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

/** A local, synchronous edit applied before the request goes out. */
type TaskPatch = (prev: TaskDetailDto) => TaskDetailDto;

interface RunOptions<TBody> {
  method: 'PATCH' | 'POST' | 'DELETE';
  body?: TBody;
  /**
   * Paints the expected result immediately. Reverted if the request fails and
   * nothing newer has landed in the meantime.
   */
  optimistic?: TaskPatch;
  /**
   * Folds the server response into the task we hold. Defaults to replacing it
   * outright; the move endpoint uses this because it answers with a
   * BoardTaskDto (a subset of the detail we must not drop).
   */
  merge?: (prev: TaskDetailDto | null, response: TaskDetailDto) => TaskDetailDto | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rebuild the tree with `patch` applied to the node with `subtaskId`. */
function patchSubtaskTree(
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

function findSubtask(
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
function removeSubtask(nodes: SubtaskNodeDto[], subtaskId: string): SubtaskNodeDto[] {
  return nodes
    .filter((node) => node.id !== subtaskId)
    .map((node) =>
      node.children.length === 0
        ? node
        : { ...node, children: removeSubtask(node.children, subtaskId) }
    );
}

export interface UseTaskDetailOptions {
  /**
   * Fired with the fresh task after every *mutation* — including the optimistic
   * patch, so a board card behind an open panel moves at the same moment the
   * panel does. Deliberately not fired by a plain GET, which would push a
   * pointless board patch every time a panel opens.
   */
  onTaskChange?: (task: TaskDetailDto) => void;
}

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
  /**
   * `member` is only used to render the avatar before the server answers; the
   * response overwrites it. Omit it to skip the optimistic step.
   */
  assign: (
    organizationUserId: string,
    member?: { name: string; avatarUrl: string | null }
  ) => Promise<boolean>;
  unassign: (organizationUserId: string) => Promise<boolean>;
  toggleSubtask: (subtaskId: string, desiredIsDone: boolean) => Promise<boolean>;
  addSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  renameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  deleteSubtask: (subtaskId: string) => Promise<boolean>;
  deleteTask: () => Promise<boolean>;
}

export function useTaskDetail(
  taskId: string,
  options?: UseTaskDetailOptions
): UseTaskDetailReturn {
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

  // Held in a ref, assigned on every render: callers can pass an inline arrow
  // without destabilising `run`, whose identity TaskPageActivity depends on.
  const onTaskChangeRef = useRef(options?.onTaskChange);
  onTaskChangeRef.current = options?.onTaskChange;

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

  /**
   * Undo an optimistic patch after its request failed. If a newer edit has
   * already been applied, restoring the old snapshot would silently undo that
   * one too — resync from the server instead.
   */
  const revert = useCallback(
    (seq: number, snapshot: TaskDetailDto) => {
      if (appliedRef.current !== seq) {
        void fetchTask();
        return;
      }
      setTask(snapshot);
    },
    [fetchTask, setTask]
  );

  const run = useCallback(
    async <TBody>(scope: TaskPendingScope, endpoint: string, options: RunOptions<TBody>) => {
      const { method, body, optimistic, merge } = options;
      const seq = ++seqRef.current;
      const snapshot = taskRef.current;
      const applied = Boolean(optimistic && snapshot);

      // Paint the expected result first so the UI never waits on the network.
      // Claiming `appliedRef` here is what makes the response for this same
      // request (which carries the same seq) still count as newer.
      if (optimistic && snapshot) {
        const next = optimistic(snapshot);
        appliedRef.current = seq;
        setTask(next);
        onTaskChangeRef.current?.(next);
      }

      beginScope(scope);
      try {
        const updated = await mutate<TBody>(endpoint, { method, body });
        if (!updated) {
          if (applied && snapshot) revert(seq, snapshot);
          return false;
        }
        // merge() reads taskRef, i.e. the optimistic state, so a partial
        // response can't drop fields the optimistic patch just set.
        const next = merge ? merge(taskRef.current, updated) : updated;
        if (next) {
          applySnapshot(seq, next);
          onTaskChangeRef.current?.(next);
        }
        setDataVersion((version) => version + 1);
        return true;
      } finally {
        endScope(scope);
      }
    },
    [mutate, applySnapshot, beginScope, endScope, revert, setTask]
  );

  const updateTitle = useCallback(
    (title: string) =>
      run('title', `/api/board/tasks/${taskId}/title`, {
        method: 'PATCH',
        body: { title },
        optimistic: (prev) => ({ ...prev, title }),
      }),
    [run, taskId]
  );

  const updateDescription = useCallback(
    (description: string | null) =>
      run('description', `/api/board/tasks/${taskId}/description`, {
        method: 'PATCH',
        body: { description },
        optimistic: (prev) => ({ ...prev, description }),
      }),
    [run, taskId]
  );

  const updatePriority = useCallback(
    (priority: TaskPriority) =>
      run('priority', `/api/board/tasks/${taskId}/priority`, {
        method: 'PATCH',
        body: { priority },
        optimistic: (prev) => ({ ...prev, priority }),
      }),
    [run, taskId]
  );

  const updateDates = useCallback(
    (dates: { startDate: string | null; dueDate: string | null }) =>
      run('dates', `/api/board/tasks/${taskId}/dates`, {
        method: 'PATCH',
        body: dates,
        optimistic: (prev) => ({ ...prev, ...dates }),
      }),
    [run, taskId]
  );

  /**
   * The move endpoint returns a BoardTaskDto — a strict subset of
   * TaskDetailDto's keys — so spreading it over the task we already hold gives
   * us the server's real groupId/position/updatedAt while keeping description,
   * subtasks and activities intact. No re-fetch, so no skeleton flash.
   *
   * The chip highlight moves on click via the optimistic patch; the response
   * only corrects position/updatedAt afterwards.
   */
  const changeStatus = useCallback(
    (groupId: string) => {
      // Clicking the chip the task already sits on is a no-op — without this
      // it PATCHes and writes a spurious TASK_MOVED activity row.
      if (taskRef.current?.groupId === groupId) return Promise.resolve(true);

      return run<{ groupId: string; targetIndex: number }>(
        'status',
        `/api/board/tasks/${taskId}/move`,
        {
          method: 'PATCH',
          body: { groupId, targetIndex: 0 },
          optimistic: (prev) => ({ ...prev, groupId }),
          merge: (prev, moved) => (prev ? { ...prev, ...(moved as unknown as BoardTaskDto) } : null),
        }
      );
    },
    [run, taskId]
  );

  const assign = useCallback(
    (organizationUserId: string, member?: { name: string; avatarUrl: string | null }) =>
      run('assignees', `/api/board/tasks/${taskId}/assignees`, {
        method: 'POST',
        body: { organizationUserId },
        optimistic: member
          ? (prev) => ({
              ...prev,
              assignees: [
                ...prev.assignees,
                { organizationUserId, name: member.name, avatarUrl: member.avatarUrl },
              ],
            })
          : undefined,
      }),
    [run, taskId]
  );

  const unassign = useCallback(
    (organizationUserId: string) =>
      run('assignees', `/api/board/tasks/${taskId}/assignees`, {
        method: 'DELETE',
        body: { organizationUserId },
        optimistic: (prev) => ({
          ...prev,
          assignees: prev.assignees.filter((a) => a.organizationUserId !== organizationUserId),
        }),
      }),
    [run, taskId]
  );

  const toggleSubtask = useCallback(
    (subtaskId: string, desiredIsDone: boolean) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: { isDone: desiredIsDone },
        // Mirrors setSubtaskDone: flip this node, move the direct parent's
        // childDone by one, and the TaskItem counter only for a root subtask
        // (invariant I6). No cascade, because the service doesn't do one.
        optimistic: (prev) => {
          const found = findSubtask(prev.subtasks, subtaskId);
          if (!found || found.node.isDone === desiredIsDone) return prev;

          const delta = desiredIsDone ? 1 : -1;
          let subtasks = patchSubtaskTree(prev.subtasks, subtaskId, (node) => ({
            ...node,
            isDone: desiredIsDone,
            // Attribution is server-stamped: cleared on uncheck (invariant
            // I7), left blank on check until the response lands.
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
            ...prev,
            subtasks,
            subtaskDone:
              found.node.depth === 0
                ? clamp(prev.subtaskDone + delta, 0, prev.subtaskTotal)
                : prev.subtaskDone,
          };
        },
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
        optimistic: (prev) => ({
          ...prev,
          subtasks: patchSubtaskTree(prev.subtasks, subtaskId, (node) => ({ ...node, title })),
        }),
      }),
    [run, taskId]
  );

  const deleteSubtask = useCallback(
    (subtaskId: string) =>
      run('subtasks', `/api/board/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        // The subtree goes with it (DB-level cascade), so the counters lose
        // only this node: its parent's, or the TaskItem's for a root subtask.
        optimistic: (prev) => {
          const found = findSubtask(prev.subtasks, subtaskId);
          if (!found) return prev;

          const wasDone = found.node.isDone;
          let subtasks = removeSubtask(prev.subtasks, subtaskId);

          if (found.parent) {
            const parentId = found.parent.id;
            subtasks = patchSubtaskTree(subtasks, parentId, (node) => ({
              ...node,
              childTotal: Math.max(0, node.childTotal - 1),
              childDone: Math.max(0, node.childDone - (wasDone ? 1 : 0)),
            }));
            return { ...prev, subtasks };
          }

          const subtaskTotal = Math.max(0, prev.subtaskTotal - 1);
          return {
            ...prev,
            subtasks,
            subtaskTotal,
            subtaskDone: clamp(prev.subtaskDone - (wasDone ? 1 : 0), 0, subtaskTotal),
          };
        },
      }),
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
