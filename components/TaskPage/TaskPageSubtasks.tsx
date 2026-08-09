// components/TaskPage/TaskPageSubtasks.tsx
// Full subtask tree (reuses the shared RecursiveSubtaskList + AddSubtaskForm)
// plus a per-row action menu (rename / delete / add nested subtask) that
// TaskDetailModal doesn't render — it never passes `renderNodeExtra`.
'use client';

import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteModal } from '@/components/shared';
import { RecursiveSubtaskList, AddSubtaskForm } from '@/components/TaskDetail';
import type { SubtaskNodeDto } from '@/types/planner';

interface TaskPageSubtasksProps {
  subtasks: SubtaskNodeDto[];
  isToggling: boolean;
  isMutating: boolean;
  onToggle: (subtaskId: string) => void;
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

// ─────────────────────────────────────────────
// Per-row action menu
// ─────────────────────────────────────────────

interface SubtaskRowMenuProps {
  subtask: SubtaskNodeDto;
  depth: number;
  disabled: boolean;
  onAddChild: (title: string) => void;
  onRename: (title: string) => void;
  onDeleteRequest: () => void;
}

function SubtaskRowMenu({ subtask, depth, disabled, onAddChild, onRename, onDeleteRequest }: SubtaskRowMenuProps) {
  const [mode, setMode] = useState<'menu' | 'rename' | 'add-child'>('menu');
  const [draft, setDraft] = useState('');

  const openRename = () => {
    setDraft(subtask.title);
    setMode('rename');
  };
  const openAddChild = () => {
    setDraft('');
    setMode('add-child');
  };
  const close = () => setMode('menu');

  const submit = () => {
    const title = draft.trim();
    if (!title) return close();
    if (mode === 'rename') onRename(title);
    if (mode === 'add-child') onAddChild(title);
    close();
  };

  if (mode !== 'menu') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-1.5"
      >
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => !draft.trim() && close()}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          placeholder={mode === 'rename' ? 'Rename subtask' : 'Subtask title'}
          disabled={disabled}
          className="h-7 text-xs w-40"
        />
        <Button type="submit" size="sm" className="h-7 px-2" disabled={disabled || !draft.trim()}>
          {mode === 'rename' ? 'Save' : 'Add'}
        </Button>
      </form>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${subtask.title}`}
          disabled={disabled}
          className="rounded p-1 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary"
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {depth < 2 && <DropdownMenuItem onSelect={openAddChild}>Add subtask</DropdownMenuItem>}
        <DropdownMenuItem onSelect={openRename}>Rename</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDeleteRequest}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
