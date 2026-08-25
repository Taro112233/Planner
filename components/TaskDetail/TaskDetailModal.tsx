// components/TaskDetail/TaskDetailModal.tsx
// Slide-over panel showing full task details. Owns only the panel chrome —
// overlay, header, close / open-full-page / delete actions — and renders the
// shared TaskDetailBody for everything else, so the panel and the full page
// have identical capabilities (Instruction-task-page.md §2).
//
// Every mutation goes through useTaskDetail, which paints the result before
// the request goes out; onTaskUpdated forwards each new snapshot to the board
// so a card behind the panel moves at the same moment the panel does.
'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { X, Calendar, Flag, Loader2, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { ConfirmDeleteModal } from '@/components/shared';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { PRIORITY_STYLES } from './priorityStyles';
import { TaskDetailBody } from './TaskDetailBody';
import { TaskTitleEditor } from './TaskTitleEditor';
import { TaskActivityFeed } from './TaskActivityFeed';
import type { BoardGroupDto, BoardTaskDto, TaskDetailDto } from '@/types/planner';

interface TaskDetailModalProps {
  /** Controls open/closed state — passed by the parent */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task to load and display */
  taskId: string;
  /** The board's columns — rendered as clickable status chips */
  groups: BoardGroupDto[];
  /** The card the board already holds, so the panel opens without a spinner. */
  initialTask?: BoardTaskDto | null;
  /** Every snapshot, optimistic ones included, so the board can stay in sync. */
  onTaskUpdated?: (updatedTask: TaskDetailDto) => void;
  /** The task was trashed from here; the parent should close and refresh. */
  onTaskDeleted?: () => void;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  taskId,
  groups,
  initialTask,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const detail = useTaskDetail(taskId, { onTaskChange: onTaskUpdated, initialTask });
  const { task, loading, error, isPending, updateTitle, deleteTask } = detail;
  const { members } = useOrganizationMembers();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentGroup = task ? groups.find((group) => group.id === task.groupId) : undefined;

  const handleSaveTitle = async (title: string) => {
    const ok = await updateTitle(title);
    if (!ok) toast.error('เปลี่ยนชื่องานไม่สำเร็จ');
    return ok;
  };

  const handleDelete = async () => {
    const ok = await deleteTask();
    if (!ok) {
      toast.error('ลบงานไม่สำเร็จ');
      setShowDeleteConfirm(false);
      return;
    }
    setShowDeleteConfirm(false);
    onTaskDeleted?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-40',
            'bg-overlay/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          ].join(' ')}
        />

        <Dialog.Content
          aria-describedby={undefined}
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
          {/* Radix renders Dialog.Title as an <h2>, so the visible title — an
              editable input half the time — lives in the header below and this
              one only names the dialog for screen readers. */}
          <Dialog.Title className="sr-only">{task?.title ?? 'Task details'}</Dialog.Title>

          {/* Always available, even while loading or erroring */}
          <Dialog.Close asChild>
            <button
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

          <Link
            href={`/board/tasks/${taskId}`}
            aria-label="Open full page"
            title="Open full page"
            className={[
              'absolute top-4 right-14 z-10 rounded-md p-1.5',
              'text-content-tertiary hover:text-content-primary',
              'hover:bg-surface-secondary',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary',
            ].join(' ')}
          >
            <ExternalLink size={16} />
          </Link>

          {/* Cold load only — a background refresh keeps the panel on screen. */}
          {loading && !task && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-content-tertiary" />
            </div>
          )}

          {!loading && !task && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
              <AlertCircle size={20} className="text-content-danger" />
              <p className="text-sm text-content-secondary">{error ?? 'Failed to load task'}</p>
            </div>
          )}

          {task && (
            <>
              {/* ── Header ─────────────────────────────────────── */}
              <div className="shrink-0 border-b border-border-subtle px-5 py-4">
                <div className="pr-20">
                  <TaskTitleEditor
                    title={task.title}
                    onSave={handleSaveTitle}
                    pending={isPending('title')}
                    variant="panel"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {currentGroup && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content-secondary">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: resolveGroupColor(currentGroup.color) }}
                      />
                      {currentGroup.name}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-content-tertiary hover:text-content-danger"
                    disabled={isPending('delete')}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="size-3.5" />
                    ลบ
                  </Button>
                </div>
              </div>

              {/* ── Scrollable body ─────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <TaskDetailBody
                  task={task}
                  detail={detail}
                  groups={groups}
                  members={members}
                  density="panel"
                  activitySlot={
                    task.activities.length > 0 ? (
                      <section aria-label="Activity">
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                          Activity
                        </h2>
                        <TaskActivityFeed items={task.activities} />
                      </section>
                    ) : null
                  }
                />
              </div>

              {/* ── Footer ─────────────────────────────────────── */}
              <div className="shrink-0 border-t border-border-subtle px-5 py-3">
                <p className="text-xs text-content-tertiary">
                  Last updated {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>

              <ConfirmDeleteModal
                open={showDeleteConfirm}
                title="ลบ task นี้?"
                description={`"${task.title}" จะถูกย้ายไปยังถังขยะ คุณสามารถกู้คืนได้ภายหลังจากหน้าถังขยะ`}
                confirmLabel="ลบ"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                loading={isPending('delete')}
              />
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
