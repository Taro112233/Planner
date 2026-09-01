// components/BoardPage/GroupColorSwatches.tsx
// The 8-color palette a column can be tagged with. Shared by the column menu
// and the add-column popover.
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  GROUP_COLOR_KEYS,
  GROUP_COLOR_LABELS,
  type GroupColorKey,
} from '@/lib/shared/group-colors';

interface GroupColorSwatchesProps {
  /** The persisted Group.color — a palette key, or legacy hex (never matches). */
  value: string | null;
  onChange: (color: GroupColorKey) => void;
  disabled?: boolean;
}

export function GroupColorSwatches({ value, onChange, disabled = false }: GroupColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GROUP_COLOR_KEYS.map((key) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            aria-label={GROUP_COLOR_LABELS[key]}
            title={GROUP_COLOR_LABELS[key]}
            aria-pressed={active}
            className={[
              'flex h-5 w-5 items-center justify-center rounded-full transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-1',
              active ? 'ring-2 ring-interactive-primary ring-offset-1' : 'hover:scale-110',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ].join(' ')}
            style={{ backgroundColor: `var(--color-group-${key})` }}
          >
            {active && <Check size={11} className="text-content-inverse" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
