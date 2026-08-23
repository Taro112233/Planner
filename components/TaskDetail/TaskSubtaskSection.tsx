// components/TaskDetail/TaskSubtaskSection.tsx
// Full subtask tree: shared RecursiveSubtaskList + AddSubtaskForm + the
// shared per-row SubtaskRowMenu (rename / delete / add nested subtask) —
// same pieces TaskDetailModal's slide-over uses.
'use client';

import React, { useState } from 'react';
import { ConfirmDeleteModal } from '@/components/shared';
import { RecursiveSubtaskList } from './RecursiveSubtaskList';
import { AddSubtaskForm } from './AddSubtaskForm';
import { SubtaskRowMenu } from './SubtaskRowMenu';
import { countCompleted, countSubtasks } from './subtaskAttribution';
import type { SubtaskNodeDto } from '@/types/planner';

interface TaskSubtaskSectionProps {
  subtasks: SubtaskNodeDto[];
  /**
   * A subtask mutation is in flight. Gates the per-row action menu only —
   * checkboxes stay live because `onToggle` sends an explicit desired state
   * (not a blind toggle), so rapid or out-of-order clicks converge.
   */
  menuPending?: boolean;
  /** Show the done/total counter and progress bar next to the heading. */
  showProgress?: boolean;
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  onAddSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  onRenameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
}

export function TaskSubtaskSection({
  subtasks,
  menuPending = false,
  showProgress = false,
  onToggle,
  onAddSubtask,
  onRenameSubtask,
  onDeleteSubtask,
}: TaskSubtaskSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await onDeleteSubtask(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Counts every level, unlike TaskItem.subtaskTotal/Done which count root
  // subtasks only (prisma/Instruction-task.md invariant I6).
  const total = showProgress ? countSubtasks(subtasks) : 0;
  const completed = showProgress ? countCompleted(subtasks) : 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section aria-label="Subtasks">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Subtasks</h2>
        {showProgress && total > 0 && (
          <span className="text-xs text-content-tertiary tabular-nums">
            {completed}/{total}
          </span>
        )}
      </div>

      {showProgress && total > 0 && (
        <div
          className="mb-4 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary"
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

      {subtasks.length > 0 ? (
        <RecursiveSubtaskList
          subtasks={subtasks}
          onToggle={onToggle}
          renderNodeExtra={(subtask, depth) => (
            <SubtaskRowMenu
              subtask={subtask}
              depth={depth}
              disabled={menuPending}
              onAddChild={(title) => onAddSubtask(title, subtask.id)}
              onRename={(title) => onRenameSubtask(subtask.id, title)}
              onDeleteRequest={() => setDeleteTarget({ id: subtask.id, title: subtask.title })}
            />
          )}
        />
      ) : (
        <p className="text-sm text-content-tertiary mb-2">No subtasks yet.</p>
      )}

      <div className="mt-2">
        {/* No `disabled` here on purpose — see AddSubtaskForm: a flag that
            flips during submit blurs the input and collapses the form. */}
        <AddSubtaskForm onSubmit={(title) => onAddSubtask(title)} />
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete subtask?"
        description={
          deleteTarget ? `"${deleteTarget.title}" and any of its own subtasks will be removed.` : undefined
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </section>
  );
}
