// components/BoardPage/BoardColumn.tsx
// One Kanban column: header (name, color dot, count, WIP warning), a
// droppable + sortable list of cards, and a quick-add-task input.
'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BoardTaskCard } from './BoardTaskCard';
import type { BoardGroupDto } from '@/types/planner';

interface BoardColumnProps {
  group: BoardGroupDto;
  onOpenTask: (taskId: string) => void;
  onAddTask: (groupId: string, title: string) => Promise<void>;
}

export function BoardColumn({ group, onOpenTask, onAddTask }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: group.id });
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-secondary border border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: group.color ?? 'var(--color-interactive-primary)' }}
          />
          <h2 className="text-sm font-semibold text-content-primary truncate">{group.name}</h2>
        </div>
        <span
          className={[
            'text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full shrink-0',
            isOverWip
              ? 'bg-surface-danger-subtle text-content-danger'
              : 'bg-surface-tertiary text-content-tertiary',
          ].join(' ')}
        >
          {group.taskItems.length}
          {group.wipLimit != null ? `/${group.wipLimit}` : ''}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 min-h-16 space-y-2 px-3 pb-2 overflow-y-auto">
        <SortableContext
          items={group.taskItems.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.taskItems.map((task) => (
            <BoardTaskCard key={task.id} task={task} onOpen={onOpenTask} />
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
    </div>
  );
}
