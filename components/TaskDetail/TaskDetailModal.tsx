// components/TaskDetail/TaskDetailModal.tsx
// Modal that displays full task details including a recursive subtask list.
// Uses a lightweight useMutation built on useTransition (no TanStack Query dependency).
'use client';

import React, { useTransition, useCallback, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Flag, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RecursiveSubtaskList } from './RecursiveSubtaskList';
import type { TaskDto } from '@/types/planner';

// ─────────────────────────────────────────────
// Lightweight useMutation hook (useTransition-based)
// ─────────────────────────────────────────────

interface UseMutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

function useMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {}
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    (variables: TVariables) => {
      setError(null);
      startTransition(async () => {
        try {
          const data = await mutationFn(variables);
          options.onSuccess?.(data);
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          options.onError?.(e);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn]
  );

  return { mutate, isPending, error };
}

// ─────────────────────────────────────────────
// API helper
// ─────────────────────────────────────────────

async function patchSubtask(variables: {
  taskId: string;
  subtaskId: string;
  organizationId: string;
}): Promise<TaskDto> {
  const res = await fetch(`/api/tasks/${variables.taskId}/subtasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subtaskId:      variables.subtaskId,
      organizationId: variables.organizationId,
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to update subtask');
  }

  return json.data as TaskDto;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface TaskDetailModalProps {
  /** Controls open/closed state — passed by the parent */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task to display — passed in by the parent (e.g., board card click) */
  task: TaskDto;
  /** Organization ID required for multi-tenant scoping in the PATCH call */
  organizationId: string;
  /** Called after a successful subtask toggle so the parent can refresh its data */
  onTaskUpdated?: (updatedTask: TaskDto) => void;
}

// ─────────────────────────────────────────────
// Priority & Status badges
// ─────────────────────────────────────────────

const PRIORITY_STYLES: Record<TaskDto['priority'], string> = {
  LOW:    'bg-surface-tertiary text-content-secondary',
  MEDIUM: 'bg-surface-warning text-content-warning',
  HIGH:   'bg-surface-danger-subtle text-content-danger',
  URGENT: 'bg-surface-danger text-content-inverse',
};

const STATUS_STYLES: Record<TaskDto['status'], string> = {
  TODO:        'bg-surface-tertiary text-content-secondary',
  IN_PROGRESS: 'bg-surface-info-subtle text-content-info',
  DONE:        'bg-surface-success-subtle text-content-success',
  CANCELLED:   'bg-surface-tertiary text-content-tertiary',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function TaskDetailModal({
  open,
  onOpenChange,
  task: initialTask,
  organizationId,
  onTaskUpdated,
}: TaskDetailModalProps) {
  // Local task state so the UI reflects toggles optimistically
  const [task, setTask] = useState<TaskDto>(initialTask);

  // Sync if parent updates the task (e.g., after refetch)
  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Subtask toggle mutation
  const { mutate: toggleSubtask, isPending: isToggling } = useMutation(patchSubtask, {
    onSuccess: (updatedTask) => {
      setTask(updatedTask);
      onTaskUpdated?.(updatedTask);
      toast.success('Subtask updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update subtask');
    },
  });

  const handleToggle = useCallback(
    (subtaskId: string) => {
      toggleSubtask({ taskId: task.id, subtaskId, organizationId });
    },
    [toggleSubtask, task.id, organizationId]
  );

  // Derived stats
  const totalSubtasks    = countSubtasks(task.subtasks);
  const completedSubtasks = countCompleted(task.subtasks);
  const progressPct = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : 0;

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
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-lg font-semibold text-content-primary leading-snug truncate">
                {task.title}
              </Dialog.Title>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Status badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[task.status]}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
                {/* Priority badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                >
                  <Flag size={10} />
                  {task.priority}
                </span>
                {/* Due date */}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
                    <Calendar size={11} />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                id="task-detail-close"
                aria-label="Close task details"
                className={[
                  'shrink-0 rounded-md p-1.5',
                  'text-content-tertiary hover:text-content-primary',
                  'hover:bg-surface-secondary',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary',
                ].join(' ')}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── Scrollable body ─────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Description */}
            {task.description && (
              <section aria-label="Description">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                  Description
                </h2>
                <p
                  id="task-detail-desc"
                  className="text-sm text-content-secondary leading-relaxed"
                >
                  {task.description}
                </p>
              </section>
            )}

            {/* Tags (from PlanDetails) */}
            {task.planDetails?.tags && task.planDetails.tags.length > 0 && (
              <section aria-label="Tags">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {task.planDetails.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-surface-secondary text-content-secondary text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <section aria-label="Subtasks">
                {/* Sub-header with progress */}
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
                    <span className="text-xs text-content-tertiary tabular-nums">
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
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

                {/* Recursive tree */}
                <RecursiveSubtaskList
                  subtasks={task.subtasks}
                  onToggle={handleToggle}
                  isToggling={isToggling}
                  depth={0}
                />
              </section>
            )}

            {/* Empty subtasks state */}
            {task.subtasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <AlertCircle size={20} className="text-content-tertiary" />
                <p className="text-sm text-content-tertiary">No subtasks yet.</p>
              </div>
            )}

            {/* Plan details — estimated hours */}
            {task.planDetails?.estimatedHours !== undefined && (
              <section aria-label="Estimate">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
                  Estimated Hours
                </h2>
                <p className="text-sm text-content-primary font-medium tabular-nums">
                  {task.planDetails.estimatedHours}h
                </p>
              </section>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────── */}
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            <p className="text-xs text-content-tertiary">
              Last updated {new Date(task.updatedAt).toLocaleString()}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

import type { SubtaskProps } from '@/types/planner';

function countSubtasks(subtasks: SubtaskProps[]): number {
  return subtasks.reduce((acc, s) => {
    return acc + 1 + (s.children ? countSubtasks(s.children) : 0);
  }, 0);
}

function countCompleted(subtasks: SubtaskProps[]): number {
  return subtasks.reduce((acc, s) => {
    const self     = s.isCompleted ? 1 : 0;
    const children = s.children ? countCompleted(s.children) : 0;
    return acc + self + children;
  }, 0);
}
