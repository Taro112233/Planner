// components/SettingsPage/SettingsAccentGrid.tsx
// The 18 accent colours from lib/client/theme-manager.ts as a labelled grid.
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/client/utils';
import type { AccentColor, AccentId } from '@/lib/client/theme-manager';

interface SettingsAccentGridProps {
  accents: AccentColor[];
  activeAccent: AccentId;
  onPick: (accentId: AccentId) => void;
}

/** Light swatches where a white check would disappear. */
const DARK_CHECK = new Set(['lime', 'yellow', 'neutral']);

export function SettingsAccentGrid({ accents, activeAccent, onPick }: SettingsAccentGridProps) {
  return (
    <div role="radiogroup" aria-label="สีหลัก" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {accents.map((accent) => {
        const active = accent.id === activeAccent;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(accent.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-colors',
              active ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'
            )}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full transition-transform',
                active ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface-card' : ''
              )}
              style={{ background: accent.swatch, ['--tw-ring-color' as string]: accent.swatch }}
            >
              {active && (
                <Check
                  size={15}
                  strokeWidth={3}
                  className={DARK_CHECK.has(accent.id) ? 'text-black/70' : 'text-white'}
                />
              )}
            </span>
            <span className="text-[11px] text-content-secondary">{accent.name}</span>
          </button>
        );
      })}
    </div>
  );
}
