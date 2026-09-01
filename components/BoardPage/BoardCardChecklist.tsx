// components/BoardPage/BoardCardChecklist.tsx
// The nested checklist the mockup shows inside every board card: indented by
// depth, struck through when done, with a mini avatar for whoever ticked it —
// and tickable in place, without opening the task.
//
// The card around it is both a dnd-kit drag handle and the click target that
// opens the panel, so every checkbox stops pointer and click events from
// reaching it. Without that, aiming at a checkbox would start a drag and open
// the task at the same time.
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail';
import type { SubtaskNodeDto } from '@/types/planner';

interface BoardCardChecklistProps {
  subtasks: SubtaskNodeDto[];
  /** Omit to render the checklist read-only (e.g. inside a DragOverlay). */
  onToggle?: (subtaskId: string, desiredIsDone: boolean) => void;
  /** Keeps a long checklist from pushing the card off the column. */
  maxRows?: number;
}

/** Depth-first flatten, so indentation can be a simple per-row style. */
function flatten(nodes: SubtaskNodeDto[]): SubtaskNodeDto[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/** Keep the card's drag sensor and open-panel click out of this control. */
function isolate(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function BoardCardChecklist({
  subtasks,
  onToggle,
  maxRows = 6,
}: BoardCardChecklistProps) {
  if (subtasks.length === 0) return null;

  const rows = flatten(subtasks);
  const visible = rows.slice(0, maxRows);
  const hidden = rows.length - visible.length;

  return (
    <ul className="mt-2 flex flex-col gap-1" aria-label="งานย่อย">
      {visible.map((node) => {
        const marker = (
          <span
            className={[
              'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
              node.isDone
                ? 'border-interactive-primary bg-interactive-primary'
                : 'border-border-secondary',
            ].join(' ')}
            aria-hidden="true"
          >
            {node.isDone && <Check size={10} className="text-content-inverse" strokeWidth={3} />}
          </span>
        );

        return (
          <li
            key={node.id}
            className="flex items-center gap-2"
            style={{ paddingLeft: node.depth * 14 }}
          >
            {onToggle ? (
              <button
                type="button"
                role="checkbox"
                aria-checked={node.isDone}
                aria-label={`${node.isDone ? 'ยกเลิกติ๊ก' : 'ติ๊ก'} ${node.title}`}
                // pointerdown is what dnd-kit's sensor listens for; click is
                // what opens the task. Both stop here.
                onPointerDown={isolate}
                onMouseDown={isolate}
                onTouchStart={isolate}
                onClick={(event) => {
                  isolate(event);
                  onToggle(node.id, !node.isDone);
                }}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-1"
              >
                {marker}
              </button>
            ) : (
              marker
            )}

            <span
              className={[
                'min-w-0 flex-1 truncate text-xs leading-snug',
                node.isDone ? 'text-content-tertiary line-through' : 'text-content-secondary',
              ].join(' ')}
            >
              {node.title}
            </span>

            {node.isDone && node.checkedByName && (
              <Avatar className="size-4 shrink-0" title={`ติ๊กโดย ${node.checkedByName}`}>
                {node.checkedByAvatarUrl && (
                  <AvatarImage src={node.checkedByAvatarUrl} alt={node.checkedByName} />
                )}
                <AvatarFallback className="text-[8px]">
                  {initials(node.checkedByName)}
                </AvatarFallback>
              </Avatar>
            )}
          </li>
        );
      })}

      {hidden > 0 && (
        <li className="pl-6 text-[11px] text-content-tertiary">อีก {hidden} รายการ</li>
      )}
    </ul>
  );
}
