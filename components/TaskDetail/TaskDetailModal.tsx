// components/TaskDetail/TaskDetailModal.tsx
// Slide-over panel showing full task details, fetched by taskId, including a
// recursive subtask checklist. Uses a lightweight useTransition-based mutation
// (no TanStack Query dependency).
'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Flag, Loader2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { RecursiveSubtaskList } from './RecursiveSubtaskList';
import type { BoardGroupDto, TaskDetailDto } from '@/types/planner';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '?';
}

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

async function readJson(res: Response, fallbackError: string): Promise<TaskDetailDto> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? fallbackError);
  }
  return json.data as TaskDetailDto;
}

async function fetchTaskDetail(taskId: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}`, { credentials: 'include' });
  return readJson(res, 'Failed to load task');
}

async function patchSubtask(taskId: string, subtaskId: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    credentials: 'include',
  });
  return readJson(res, 'Failed to update subtask');
}

async function postSubtask(taskId: string, title: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}/subtasks`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return readJson(res, 'Failed to add subtask');
}

async function postAssignee(taskId: string, organizationUserId: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}/assignees`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationUserId }),
  });
  return readJson(res, 'Failed to assign member');
}

async function deleteAssignee(taskId: string, organizationUserId: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}/assignees`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationUserId }),
  });
  return readJson(res, 'Failed to unassign member');
}

/**
 * The move endpoint returns a BoardTaskDto (no description/subtasks/activities),
 * so re-fetch the full detail afterwards rather than trusting its response shape.
 */
async function patchMove(taskId: string, groupId: string): Promise<TaskDetailDto> {
  const res = await fetch(`/api/board/tasks/${taskId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, targetIndex: 0 }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to change status');
  }
  return fetchTaskDetail(taskId);
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface TaskDetailModalProps {
  /** Controls open/closed state — passed by the parent */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task to load and display */
  taskId: string;
  /** The board's columns — rendered as clickable status chips */
  groups: BoardGroupDto[];
  /** Called after a successful mutation so the parent can refresh its board data */
  onTaskUpdated?: (updatedTask: TaskDetailDto) => void;
}

// ─────────────────────────────────────────────
// Priority badge
// ─────────────────────────────────────────────

const PRIORITY_STYLES: Record<TaskDetailDto['priority'], string> = {
  LOW: 'bg-surface-tertiary text-content-secondary',
  MEDIUM: 'bg-surface-warning text-content-warning',
  HIGH: 'bg-surface-danger-subtle text-content-danger',
  URGENT: 'bg-surface-danger text-content-inverse',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function TaskDetailModal({
  open,
  onOpenChange,
  taskId,
  groups,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskDetailDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, startToggle] = useTransition();
  const [isMutating, startMutate] = useTransition();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const { members } = useOrganizationMembers();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetchTaskDetail(taskId)
      .then((data) => {
        if (!cancelled) setTask(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load task');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  const handleToggle = useCallback(
    (subtaskId: string) => {
      startToggle(async () => {
        try {
          const updated = await patchSubtask(taskId, subtaskId);
          setTask(updated);
          onTaskUpdated?.(updated);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update subtask');
        }
      });
    },
    [taskId, onTaskUpdated]
  );

  const handleStatusChange = useCallback(
    (groupId: string) => {
      if (task?.groupId === groupId) return;
      startMutate(async () => {
        try {
          const updated = await patchMove(taskId, groupId);
          setTask(updated);
          onTaskUpdated?.(updated);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to change status');
        }
      });
    },
    [taskId, task?.groupId, onTaskUpdated]
  );

  const handleToggleAssignee = useCallback(
    (organizationUserId: string, isAssigned: boolean) => {
      startMutate(async () => {
        try {
          const updated = isAssigned
            ? await deleteAssignee(taskId, organizationUserId)
            : await postAssignee(taskId, organizationUserId);
          setTask(updated);
          onTaskUpdated?.(updated);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update assignee');
        }
      });
    },
    [taskId, onTaskUpdated]
  );

  const handleAddSubtask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = subtaskDraft.trim();
      if (!title) return;

      startMutate(async () => {
        try {
          const updated = await postSubtask(taskId, title);
          setTask(updated);
          onTaskUpdated?.(updated);
          setSubtaskDraft('');
          setAddingSubtask(false);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to add subtask');
        }
      });
    },
    [taskId, subtaskDraft, onTaskUpdated]
  );

  const totalSubtasks = task ? countSubtasks(task.subtasks) : 0;
  const completedSubtasks = task ? countCompleted(task.subtasks) : 0;
  const progressPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-40',
            'bg-overlay/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          ].join(' ')}
        />

        {/* Panel */}
        <Dialog.Content
          aria-describedby="task-detail-desc"
          className={[
            'fixed z-50 inset-y-0 right-0',
            'w-full max-w-lg',
            'flex flex-col',
            'bg-surface-primary border-l border-border-subtle',
            'shadow-2xl',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
            'duration-300 ease-in-out',
          ].join(' ')}
        >
          {/* Close button (always available, even while loading/erroring) */}
          <Dialog.Close asChild>
            <button
              id="task-detail-close"
              aria-label="Close task details"
              className={[
                'absolute top-4 right-4 z-10 rounded-md p-1.5',
                'text-content-tertiary hover:text-content-primary',
                'hover:bg-surface-secondary',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary',
              ].join(' ')}
            >
              <X size={18} />
            </button>
          </Dialog.Close>

          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-content-tertiary" />
            </div>
          )}

          {!isLoading && loadError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <AlertCircle size={20} className="text-content-danger" />
              <p className="text-sm text-content-secondary">{loadError}</p>
            </div>
          )}

          {!isLoading && !loadError && task && (
            <>
              {/* ── Header ─────────────────────────────────────── */}
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-lg font-semibold text-content-primary leading-snug truncate pr-8">
                    {task.title}
                  </Dialog.Title>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const currentGroup = groups.find((g) => g.id === task.groupId);
                      return currentGroup ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-secondary text-content-secondary">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: currentGroup.color ?? 'var(--color-interactive-primary)' }}
                          />
                          {currentGroup.name}
                        </span>
                      ) : null;
                    })()}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                    >
                      <Flag size={10} />
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
                        <Calendar size={11} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Scrollable body ─────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {task.description && (
                  <section aria-label="Description">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                      Description
                    </h2>
                    <p id="task-detail-desc" className="text-sm text-content-secondary leading-relaxed">
                      {task.description}
                    </p>
                  </section>
                )}

                {groups.length > 0 && (
                  <section aria-label="Status">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                      Status
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {groups.map((group) => {
                        const active = group.id === task.groupId;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => handleStatusChange(group.id)}
                            disabled={isMutating}
                            className={[
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                              active
                                ? 'bg-interactive-primary text-primary-foreground'
                                : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary',
                              isMutating && 'opacity-60 cursor-not-allowed',
                            ].join(' ')}
                          >
                            {group.name}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {task.badges.length > 0 && (
                  <section aria-label="Badges">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                      Badges
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {task.badges.map((badge) => (
                        <span
                          key={badge.id}
                          className="px-2 py-0.5 rounded-full bg-surface-secondary text-content-secondary text-xs"
                          style={badge.color ? { borderLeft: `3px solid ${badge.color}` } : undefined}
                        >
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section aria-label="Assignees">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                    Assignees
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => {
                      const assigned = task.assignees.some(
                        (a) => a.organizationUserId === member.organizationUserId
                      );
                      return (
                        <button
                          key={member.organizationUserId}
                          type="button"
                          onClick={() => handleToggleAssignee(member.organizationUserId, assigned)}
                          disabled={isMutating}
                          title={member.name}
                          className={[
                            'rounded-full transition-all',
                            assigned
                              ? 'ring-2 ring-interactive-primary'
                              : 'ring-1 ring-border-subtle opacity-50 hover:opacity-100',
                            isMutating && 'cursor-not-allowed',
                          ].join(' ')}
                        >
                          <Avatar size="sm">
                            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                            <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
                          </Avatar>
                        </button>
                      );
                    })}
                    {members.length === 0 && (
                      <p className="text-xs text-content-tertiary">No members yet.</p>
                    )}
                  </div>
                </section>

                {/* Subtasks */}
                <section aria-label="Subtasks">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                      Subtasks
                    </h2>
                    <div className="flex items-center gap-2">
                      {isToggling && (
                        <Loader2
                          size={12}
                          className="animate-spin text-content-tertiary"
                          aria-label="Updating subtask..."
                        />
                      )}
                      {totalSubtasks > 0 && (
                        <span className="text-xs text-content-tertiary tabular-nums">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      )}
                    </div>
                  </div>

                  {totalSubtasks > 0 && (
                    <div
                      className="w-full h-1 rounded-full bg-surface-tertiary mb-4 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${progressPct}% of subtasks completed`}
                    >
                      <div
                        className="h-full rounded-full bg-interactive-primary transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}

                  {task.subtasks.length > 0 ? (
                    <RecursiveSubtaskList
                      subtasks={task.subtasks}
                      onToggle={handleToggle}
                      isToggling={isToggling}
                      depth={0}
                    />
                  ) : (
                    <p className="text-sm text-content-tertiary mb-2">No subtasks yet.</p>
                  )}

                  {addingSubtask ? (
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                      <Input
                        autoFocus
                        value={subtaskDraft}
                        onChange={(e) => setSubtaskDraft(e.target.value)}
                        onBlur={() => !subtaskDraft.trim() && setAddingSubtask(false)}
                        placeholder="Subtask title"
                        disabled={isMutating}
                        className="h-8 text-sm"
                      />
                      <Button type="submit" size="sm" className="h-8" disabled={isMutating || !subtaskDraft.trim()}>
                        Add
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingSubtask(true)}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition-colors"
                    >
                      <Plus size={14} />
                      Add subtask
                    </button>
                  )}
                </section>

                {task.activities.length > 0 && (
                  <section aria-label="Activity">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3">
                      Activity
                    </h2>
                    <div className="flex flex-col gap-3">
                      {task.activities.map((activity) => (
                        <div key={activity.id} className="text-xs text-content-secondary leading-relaxed">
                          <span className="font-medium text-content-primary">{activity.actorNameSnapshot}</span>{' '}
                          {formatActivity(activity)}
                          <span className="block text-content-tertiary mt-0.5">
                            {new Date(activity.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* ── Footer ─────────────────────────────────────── */}
              <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
                <p className="text-xs text-content-tertiary">
                  Last updated {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

import type { SubtaskNodeDto, TaskActivityDto } from '@/types/planner';

function countSubtasks(subtasks: SubtaskNodeDto[]): number {
  return subtasks.reduce((acc, s) => acc + 1 + countSubtasks(s.children), 0);
}

function countCompleted(subtasks: SubtaskNodeDto[]): number {
  return subtasks.reduce((acc, s) => acc + (s.isDone ? 1 : 0) + countCompleted(s.children), 0);
}

function formatActivity(activity: TaskActivityDto): string {
  const target = activity.targetTitle ? ` "${activity.targetTitle}"` : '';
  switch (activity.action) {
    case 'TASK_CREATED':
      return 'created this task';
    case 'TASK_UPDATED':
      return 'updated this task';
    case 'TASK_STATUS_CHANGED':
      return 'changed the status';
    case 'TASK_MOVED':
      return 'moved this task';
    case 'TASK_ASSIGNED':
      return 'assigned a member';
    case 'TASK_UNASSIGNED':
      return 'unassigned a member';
    case 'TASK_DELETED':
      return 'deleted this task';
    case 'SUBTASK_CREATED':
      return `added subtask${target}`;
    case 'SUBTASK_RENAMED':
      return `renamed a subtask${target}`;
    case 'SUBTASK_CHECKED':
      return `checked${target}`;
    case 'SUBTASK_UNCHECKED':
      return `unchecked${target}`;
    case 'SUBTASK_MOVED':
      return `moved a subtask${target}`;
    case 'SUBTASK_DELETED':
      return `deleted a subtask${target}`;
    default:
      return activity.action.replace(/_/g, ' ').toLowerCase();
  }
}
