// components/BoardPage/BoardColumn.tsx
// One Kanban column: header (inline-renamable name, color dot, count, WIP
// warning, "⋯" settings menu), a droppable + sortable list of cards, and a
// quick-add-task input.
'use client';

import React, { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineTextEditor } from '@/components/shared';
import { BoardTaskCard } from './BoardTaskCard';
import { BoardColumnMenu } from './BoardColumnMenu';
import { DeleteColumnDialog } from './DeleteColumnDialog';
import type { GroupColorKey } from '@/lib/shared/group-colors';
import type { BoardGroupDto, GroupSettingsDto } from '@/types/planner';
import { resolveGroupColor } from '@/lib/shared/group-colors';

interface BoardColumnProps {
  group: BoardGroupDto;
  /** Every other column — the delete dialog's relocation targets. */
  siblings: GroupSettingsDto[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onOpenTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, desiredIsDone: boolean) => void;
  onAddTask: (groupId: string, title: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<boolean>;
  onRecolorGroup: (groupId: string, color: GroupColorKey) => void;
  onSetWipLimit: (groupId: string, wipLimit: number | null) => void;
  onMoveGroup: (groupId: string, direction: -1 | 1) => void;
  onDeleteGroup: (groupId: string, targetGroupId: string) => Promise<void>;
}

export function BoardColumn({
  group,
  siblings,
  canMoveLeft,
  canMoveRight,
  onOpenTask,
  onToggleSubtask,
  onAddTask,
  onRenameGroup,
  onRecolorGroup,
  onSetWipLimit,
  onMoveGroup,
  onDeleteGroup,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: group.id });
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const isOverWip = group.wipLimit != null && group.taskItems.length > group.wipLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    setDraft('');
    try {
      await onAddTask(group.id, title);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (targetGroupId: string) => {
    setDeleting(true);
    try {
      await onDeleteGroup(group.id, targetGroupId);
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-secondary border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: resolveGroupColor(group.color) }}
          />
          {/* Double-click to rename, matching the mockup; the ⋯ menu drives the
              same editor through `editing`. */}
          <InlineTextEditor
            value={group.name}
            onSave={(name) => onRenameGroup(group.id, name)}
            as="h2"
            activateOn="doubleClick"
            ariaLabel={`ชื่อหัวข้อ ${group.name}`}
            editing={renaming}
            onEditingChange={setRenaming}
            displayClassName="min-w-0 truncate text-sm font-semibold text-content-primary"
            inputClassName="text-sm font-semibold text-content-primary"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={[
              'text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full',
              isOverWip
                ? 'bg-surface-danger-subtle text-content-danger'
                : 'bg-surface-tertiary text-content-tertiary',
            ].join(' ')}
          >
            {group.taskItems.length}
            {group.wipLimit != null ? `/${group.wipLimit}` : ''}
          </span>
          <BoardColumnMenu
            group={group}
            taskCount={group.taskItems.length}
            isOnlyColumn={siblings.length === 0}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onRenameRequest={() => setRenaming(true)}
            onColorPick={(color) => onRecolorGroup(group.id, color)}
            onWipLimitCommit={(wipLimit) => onSetWipLimit(group.id, wipLimit)}
            onAddCardRequest={() => quickAddRef.current?.focus()}
            onMoveLeft={() => onMoveGroup(group.id, -1)}
            onMoveRight={() => onMoveGroup(group.id, 1)}
            onDeleteRequest={() => setConfirmingDelete(true)}
          />
        </div>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 min-h-16 space-y-2 px-3 pb-2 overflow-y-auto">
        <SortableContext
          items={group.taskItems.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.taskItems.map((task) => (
            <BoardTaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onToggleSubtask={onToggleSubtask}
            />
          ))}
        </SortableContext>

        {group.taskItems.length === 0 && (
          <p className="py-6 text-center text-xs text-content-tertiary">No tasks yet</p>
        )}
      </div>

      {/* Quick add */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 px-3 py-2.5 border-t border-border-subtle"
      >
        <Input
          ref={quickAddRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…"
          className="h-8 text-sm"
          disabled={submitting}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={submitting || !draft.trim()}
        >
          <Plus size={16} />
        </Button>
      </form>

      <DeleteColumnDialog
        open={confirmingDelete}
        group={group}
        targets={siblings}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
        loading={deleting}
      />
    </div>
  );
}
