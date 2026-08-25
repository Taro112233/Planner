// components/BoardPage/BoardTaskCard.tsx
// Draggable card rendered inside a BoardColumn's SortableContext.
'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PRIORITY_STYLES } from '@/components/TaskDetail/priorityStyles';
import { initials } from '@/components/TaskDetail/subtaskAttribution';
import { BoardCardChecklist } from './BoardCardChecklist';
import type { BoardTaskDto } from '@/types/planner';

interface BoardTaskCardProps {
  task: BoardTaskDto;
  onOpen: (taskId: string) => void;
  /** Omitted by the drag overlay, which is a static preview. */
  onToggleSubtask?: (taskId: string, subtaskId: string, desiredIsDone: boolean) => void;
  /** Static preview rendered inside a DragOverlay — skips sortable wiring. */
  overlay?: boolean;
}

export function BoardTaskCard({
  task,
  onOpen,
  onToggleSubtask,
  overlay = false,
}: BoardTaskCardProps) {
  const sortable = useSortable({ id: task.id, disabled: overlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => !overlay && onOpen(task.id)}
      className={[
        'rounded-lg border border-border-subtle bg-surface-primary p-3',
        'shadow-sm hover:shadow-md hover:border-interactive-primary/40',
        overlay ? 'shadow-lg rotate-2' : 'cursor-grab active:cursor-grabbing',
        'transition-all duration-150',
      ].join(' ')}
    >
      {task.badges[0] && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mb-2 bg-surface-secondary text-content-secondary"
          style={
            task.badges[0].color
              ? { backgroundColor: `${task.badges[0].color}1a`, color: task.badges[0].color }
              : undefined
          }
        >
          {task.badges[0].name}
        </span>
      )}

      <p className="text-sm font-medium text-content-primary leading-snug mb-2 line-clamp-3">
        {task.title}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          <Flag size={9} />
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-content-tertiary">
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {task.assignees[0] && (
          <Avatar size="sm" className="ml-auto h-5 w-5">
            {task.assignees[0].avatarUrl && (
              <AvatarImage src={task.assignees[0].avatarUrl} alt={task.assignees[0].name} />
            )}
            <AvatarFallback className="text-[9px]">{initials(task.assignees[0].name)}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* The mockup puts the checklist itself on the card, not just a counter,
          and lets you tick it there. */}
      <BoardCardChecklist
        subtasks={task.subtasks}
        onToggle={
          onToggleSubtask
            ? (subtaskId, desiredIsDone) => onToggleSubtask(task.id, subtaskId, desiredIsDone)
            : undefined
        }
      />

      {task.subtaskTotal > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-content-tertiary mb-1">
            <span className="tabular-nums">
              {task.subtaskDone}/{task.subtaskTotal}
            </span>
          </div>
          <div className="h-1 rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-interactive-primary transition-all duration-300"
              style={{ width: `${Math.round((task.subtaskDone / task.subtaskTotal) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
