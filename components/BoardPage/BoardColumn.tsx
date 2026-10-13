// components/BoardPage/BoardColumn.tsx
// One Kanban column, mockup style: no box — a header (colour dot, inline-
// renamable name, count pill with WIP warning, "⋯" menu) over cards sitting
// straight on the canvas, and a "＋ เพิ่มการ์ด" button that opens the
// quick-add field.
'use client';

import React, { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { InlineTextEditor } from '@/components/shared';
import { BoardTaskCard } from './BoardTaskCard';
import { BoardColumnMenu } from './BoardColumnMenu';
import { DeleteColumnDialog } from './DeleteColumnDialog';
import type { GroupColorKey } from '@/lib/shared/group-colors';
import type { BoardGroupDto, GroupSettingsDto } from '@/types/planner';
import { resolveGroupColor } from '@/lib/shared/group-colors';

interface BoardColumnProps {
  /** Set while the board is filtered or sorted — see lib/shared/board-filter.ts. */
  dragDisabled?: boolean;
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
  dragDisabled = false,
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
  const { setNodeRef } = useDroppable({ id: group.id, data: { type: 'column' } });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const closeQuickAdd = () => {
    setDraft('');
    setAdding(false);
  };

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
    <div className="flex max-h-[calc(100vh-11rem)] w-[266px] shrink-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-2.5 pt-0.5">
        <span
          className="size-2 shrink-0 rounded-full"
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
        <span
          className={[
            'shrink-0 rounded-full px-2 py-px text-xs tabular-nums',
            isOverWip
              ? 'bg-surface-danger-subtle text-content-danger'
              : 'bg-surface-tertiary text-content-tertiary',
          ].join(' ')}
        >
          {group.taskItems.length}
          {group.wipLimit != null ? `/${group.wipLimit}` : ''}
        </span>
        <span className="flex-1" />
        <BoardColumnMenu
          group={group}
          taskCount={group.taskItems.length}
          isOnlyColumn={siblings.length === 0}
          canMoveLeft={canMoveLeft}
          canMoveRight={canMoveRight}
          onRenameRequest={() => setRenaming(true)}
          onColorPick={(color) => onRecolorGroup(group.id, color)}
          onWipLimitCommit={(wipLimit) => onSetWipLimit(group.id, wipLimit)}
          onAddCardRequest={() => setAdding(true)}
          onMoveLeft={() => onMoveGroup(group.id, -1)}
          onMoveRight={() => onMoveGroup(group.id, 1)}
          onDeleteRequest={() => setConfirmingDelete(true)}
        />
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex min-h-16 flex-1 flex-col gap-[11px] overflow-y-auto px-[3px] pb-1 pt-0.5"
      >
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
              dragDisabled={dragDisabled}
            />
          ))}
        </SortableContext>

        {adding && (
          <form onSubmit={handleSubmit}>
            <input
              ref={quickAddRef}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeQuickAdd();
              }}
              onBlur={() => {
                if (!draft.trim() && !submitting) closeQuickAdd();
              }}
              placeholder="ชื่องานใหม่ แล้วกด Enter"
              disabled={submitting}
              className="w-full rounded-lg border-[1.5px] border-interactive-primary bg-surface-card px-2.5 py-1.5 text-sm text-content-primary outline-none"
            />
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setAdding(true);
            quickAddRef.current?.focus();
          }}
          className="w-full rounded-lg px-2 py-[7px] text-center text-sm text-content-tertiary transition-colors hover:bg-surface-tertiary hover:text-content-primary"
        >
          ＋ เพิ่มการ์ด
        </button>
      </div>

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
