// components/BoardPage/BoardViewSwitcher.tsx
// Segmented control for switching between the four board views. All four
// views read the same BoardDto — this only toggles which one is rendered.
'use client';

import React from 'react';
import { cn } from '@/lib/client/utils';

export type BoardViewMode = 'board' | 'list' | 'calendar' | 'timeline';

const VIEWS: { value: BoardViewMode; label: string }[] = [
  { value: 'board', label: 'บอร์ด' },
  { value: 'list', label: 'รายการ' },
  { value: 'calendar', label: 'ปฏิทิน' },
  { value: 'timeline', label: 'ไทม์ไลน์' },
];

interface BoardViewSwitcherProps {
  value: BoardViewMode;
  onChange: (value: BoardViewMode) => void;
}

export function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
  return (
    <div role="tablist" aria-label="มุมมอง" className="inline-flex rounded-[9px] bg-surface-tertiary p-0.5">
      {VIEWS.map((view) => {
        const active = view.value === value;
        return (
          <button
            key={view.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(view.value)}
            className={cn(
              'whitespace-nowrap rounded-[7px] px-[15px] py-[5px] text-[13px] text-content-primary transition-all',
              active ? 'bg-surface-card font-semibold shadow-elevation-1' : 'hover:text-content-secondary'
            )}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
