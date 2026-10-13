// components/BoardPage/BoardFilterBar.tsx
// The mockup's "⚟ ตัวกรอง" and "↕ เรียง" buttons. Filtering and sorting are a
// view only (lib/shared/board-filter.ts); the stored card order never changes.
'use client';

import React from 'react';
import { ArrowUpDown, Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PRIORITIES, PRIORITY_LABELS } from '@/components/TaskDetail';
import { cn } from '@/lib/client/utils';
import {
  BOARD_SORT_LABELS,
  EMPTY_BOARD_FILTER,
  activeFilterCount,
  type BoardFilterState,
  type BoardSortKey,
} from '@/lib/shared/board-filter';

interface BoardFilterBarProps {
  value: BoardFilterState;
  onChange: (next: BoardFilterState) => void;
  /** The viewer's membership id; without it "เฉพาะงานของฉัน" is hidden. */
  viewerId: string | null;
}

export function BoardFilterBar({ value, onChange, viewerId }: BoardFilterBarProps) {
  const count = activeFilterCount(value);

  const togglePriority = (priority: (typeof PRIORITIES)[number]) =>
    onChange({
      ...value,
      priorities: value.priorities.includes(priority)
        ? value.priorities.filter((p) => p !== priority)
        : [...value.priorities, priority],
    });

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <SlidersHorizontal size={14} />
            ตัวกรอง
            {count > 0 && (
              <span className="rounded-full bg-interactive-primary px-1.5 text-[10px] text-primary-foreground">
                {count}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2">
          <p className="px-1.5 pb-1.5 text-[10.5px] text-content-tertiary">ความสำคัญ</p>
          <div className="flex flex-wrap gap-1.5 px-1.5 pb-2.5">
            {PRIORITIES.map((priority) => {
              const on = value.priorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  aria-pressed={on}
                  onClick={() => togglePriority(priority)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11.5px] transition-colors',
                    on
                      ? 'bg-interactive-primary text-primary-foreground'
                      : 'bg-surface-tertiary text-content-secondary hover:bg-surface-interactive'
                  )}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              );
            })}
          </div>

          {viewerId && (
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] hover:bg-surface-secondary">
              <Checkbox
                checked={value.assigneeId === viewerId}
                onCheckedChange={(checked) => onChange({ ...value, assigneeId: checked ? viewerId : null })}
              />
              เฉพาะงานของฉัน
            </label>
          )}

          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_BOARD_FILTER, sort: value.sort })}
            disabled={count === 0}
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] text-content-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <RotateCcw size={13} />
            ล้างตัวกรอง
          </button>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <ArrowUpDown size={14} />
            {BOARD_SORT_LABELS[value.sort]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(Object.keys(BOARD_SORT_LABELS) as BoardSortKey[]).map((key) => (
            <DropdownMenuItem key={key} onSelect={() => onChange({ ...value, sort: key })}>
              <span className="w-3.5">{value.sort === key && <Check size={13} />}</span>
              {BOARD_SORT_LABELS[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
