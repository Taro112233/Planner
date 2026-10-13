// components/BoardPage/BoardListView.tsx
// Flat, grouped-by-column list rendering of the board — same BoardDto as the
// Kanban view, presentational only (no fetches of its own).
'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BoardDto, BoardTaskDto } from '@/types/planner';
import { resolveGroupColor } from '@/lib/shared/group-colors';

interface BoardListViewProps {
  board: BoardDto;
  onOpenTask: (taskId: string) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '?';
}

export function BoardListView({ board, onOpenTask }: BoardListViewProps) {
  return (
    <div className="flex flex-col">
      {board.groups.map((group) => (
        <div key={group.id} className="mb-4">
          <div className="sticky top-0 z-[2] flex items-center gap-2 bg-surface-card px-0.5 pb-1.5 pt-3.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: resolveGroupColor(group.color) }}
            />
            <h2 className="text-sm font-semibold text-content-primary">{group.name}</h2>
            <span className="text-xs text-content-tertiary tabular-nums">{group.taskItems.length}</span>
          </div>

          {group.taskItems.length === 0 && (
            <p className="py-3 pl-4 text-xs text-content-tertiary">ไม่มีงาน</p>
          )}

          {group.taskItems.map((task) => (
            <BoardListRow key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BoardListRow({ task, onOpen }: { task: BoardTaskDto; onOpen: (id: string) => void }) {
  const badge = task.badges[0];
  const assignee = task.assignees[0];
  const isComplete = task.subtaskTotal > 0 && task.subtaskDone === task.subtaskTotal;

  return (
    <button
      onClick={() => onOpen(task.id)}
      className="flex w-full items-center gap-[11px] border-t border-border-subtle px-1 py-[9px] text-left text-[13.5px] transition-colors hover:bg-surface-secondary"
    >
      <span
        className={[
          'size-[19px] shrink-0 rounded-full border-[1.6px]',
          isComplete ? 'bg-interactive-primary border-interactive-primary' : 'border-border-secondary',
        ].join(' ')}
      />
      <span
        className={[
          'flex-1 min-w-0 text-sm font-medium truncate',
          isComplete ? 'text-content-tertiary line-through' : 'text-content-primary',
        ].join(' ')}
      >
        {task.title}
      </span>

      {task.subtaskTotal > 0 && (
        <span className="text-xs text-content-tertiary tabular-nums shrink-0">
          {task.subtaskDone}/{task.subtaskTotal}
        </span>
      )}

      {badge && (
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-surface-secondary text-content-secondary"
          style={
            badge.color
              ? { backgroundColor: `color-mix(in oklch, ${badge.color} 14%, transparent)`, color: badge.color }
              : undefined
          }
        >
          {badge.name}
        </span>
      )}

      {task.dueDate && (
        <span className="inline-flex items-center gap-1 text-xs text-content-tertiary shrink-0 w-16 justify-end">
          <Calendar size={11} />
          {new Date(task.dueDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {assignee && (
        <Avatar size="sm" className="shrink-0">
          {assignee.avatarUrl && <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />}
          <AvatarFallback className="text-[10px]">{initials(assignee.name)}</AvatarFallback>
        </Avatar>
      )}
    </button>
  );
}
