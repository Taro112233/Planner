// components/TaskPage/TaskPageSubtasks.tsx
// Full subtask tree: shared RecursiveSubtaskList + AddSubtaskForm + the
// shared per-row SubtaskRowMenu (rename / delete / add nested subtask) —
// same pieces TaskDetailModal's slide-over uses.
'use client';

import React, { useState } from 'react';
import { ConfirmDeleteModal } from '@/components/shared';
import { RecursiveSubtaskList, AddSubtaskForm, SubtaskRowMenu } from '@/components/TaskDetail';
import type { SubtaskNodeDto } from '@/types/planner';

interface TaskPageSubtasksProps {
  subtasks: SubtaskNodeDto[];
  /**
   * A subtask mutation is in flight. Gates the per-row action menu only —
   * checkboxes stay live because `onToggle` sends an explicit desired state
   * (not a blind toggle), so rapid or out-of-order clicks converge.
   */
  menuPending?: boolean;
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  onAddSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  onRenameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
}

export function TaskPageSubtasks({
  subtasks,
  menuPending = false,
  onToggle,
  onAddSubtask,
  onRenameSubtask,
  onDeleteSubtask,
}: TaskPageSubtasksProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await onDeleteSubtask(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <section aria-label="Subtasks">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3">Subtasks</h2>

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
