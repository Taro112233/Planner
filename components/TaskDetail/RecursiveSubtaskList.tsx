// components/TaskDetail/RecursiveSubtaskList.tsx
// Renders a recursive tree of SubtaskNodeDto, with a checkbox per node.
// The schema caps real data at depth 2 (root/child/grandchild); MAX_DEPTH is
// just a defensive render guard.
'use client';

import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, ChevronRight } from 'lucide-react';
import type { SubtaskNodeDto } from '@/types/planner';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface RecursiveSubtaskListProps {
  /** Array of subtask nodes to render at this level */
  subtasks: SubtaskNodeDto[];
  /**
   * Called when the user toggles a checkbox. Bubbles up from any depth —
   * always passes the leaf node's ID plus the desired next isDone value
   * (not a blind toggle — see prisma/Instruction-task.md §6).
   */
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  /** Whether a toggle mutation is currently in-flight */
  isToggling: boolean;
  /** Current nesting depth — enforced ≤ 10, start at 0 */
  depth?: number;
  /**
   * Optional per-row slot (e.g. a rename/delete/add-child action menu),
   * rendered next to the label. Omit to leave rows exactly as-is — used by
   * TaskDetailModal, which doesn't pass this prop.
   */
  renderNodeExtra?: (subtask: SubtaskNodeDto, depth: number) => React.ReactNode;
}

const MAX_DEPTH = 10;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function RecursiveSubtaskList({
  subtasks,
  onToggle,
  isToggling,
  depth = 0,
  renderNodeExtra,
}: RecursiveSubtaskListProps) {
  if (!subtasks || subtasks.length === 0) return null;
  if (depth > MAX_DEPTH) return null;

  return (
    <ul
      className="flex flex-col gap-1"
      style={{ paddingLeft: depth === 0 ? 0 : '1.25rem' }}
      role="list"
      aria-label={depth === 0 ? 'Subtasks' : `Subtasks level ${depth + 1}`}
    >
      {subtasks.map((subtask) => (
        <SubtaskRow
          key={subtask.id}
          subtask={subtask}
          onToggle={onToggle}
          isToggling={isToggling}
          depth={depth}
          renderNodeExtra={renderNodeExtra}
        />
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────
// SubtaskRow — a single node in the tree
// ─────────────────────────────────────────────

interface SubtaskRowProps {
  subtask: SubtaskNodeDto;
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  isToggling: boolean;
  depth: number;
  renderNodeExtra?: (subtask: SubtaskNodeDto, depth: number) => React.ReactNode;
}

function SubtaskRow({ subtask, onToggle, isToggling, depth, renderNodeExtra }: SubtaskRowProps) {
  const hasChildren = subtask.children.length > 0;

  return (
    <li className="select-none">
      {/* Row: checkbox + label */}
      <div className="flex items-center gap-2.5 group py-1">
        {/* Depth indicator chevrons (decorative) */}
        {depth > 0 && (
          <ChevronRight
            className="text-content-tertiary shrink-0"
            size={12}
            aria-hidden="true"
          />
        )}

        {/* Radix Checkbox */}
        <Checkbox.Root
          id={`subtask-${subtask.id}`}
          checked={subtask.isDone}
          onCheckedChange={() => onToggle(subtask.id, !subtask.isDone)}
          disabled={isToggling}
          aria-label={`Toggle subtask: ${subtask.title}`}
          className={[
            'h-4 w-4 shrink-0 rounded border transition-all duration-150',
            'border-border-subtle bg-surface-primary',
            'data-[state=checked]:bg-interactive-primary data-[state=checked]:border-interactive-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
        >
          <Checkbox.Indicator className="flex items-center justify-center">
            <Check size={10} className="text-content-inverse" strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Root>

        {/* Label */}
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={[
            'text-sm leading-snug cursor-pointer transition-all duration-150',
            subtask.isDone
              ? 'line-through text-content-tertiary'
              : 'text-content-primary group-hover:text-content-secondary',
            isToggling ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {subtask.title}
        </label>

        {renderNodeExtra && (
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {renderNodeExtra(subtask, depth)}
          </div>
        )}
      </div>

      {/* Recursive children */}
      {hasChildren && depth < MAX_DEPTH && (
        <RecursiveSubtaskList
          subtasks={subtask.children}
          onToggle={onToggle}
          isToggling={isToggling}
          depth={depth + 1}
          renderNodeExtra={renderNodeExtra}
        />
      )}
    </li>
  );
}
