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
  isToggling: boolean;
  isMutating: boolean;
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  onAddSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  onRenameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
}

export function TaskPageSubtasks({
  subtasks,
  isToggling,
  isMutating,
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
          isToggling={isToggling}
          renderNodeExtra={(subtask, depth) => (
            <SubtaskRowMenu
              subtask={subtask}
              depth={depth}
              disabled={isMutating}
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
        <AddSubtaskForm onSubmit={(title) => onAddSubtask(title)} disabled={isMutating} />
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
