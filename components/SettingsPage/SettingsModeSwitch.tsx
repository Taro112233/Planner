// components/SettingsPage/SettingsModeSwitch.tsx
// Two preview tiles — สว่าง / มืด — instead of a bare toggle, so the choice
// shows what it will look like.
'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/client/utils';

interface SettingsModeSwitchProps {
  isDark: boolean;
  onToggle: () => void;
}

const MODES = [
  // Fixed preview colours: each tile depicts its mode whatever the current one is.
  { dark: false, label: 'สว่าง', Icon: Sun, canvas: '#f5f5f7', card: '#ffffff', line: '#d7d7db' },
  { dark: true, label: 'มืด', Icon: Moon, canvas: '#1c1c1e', card: '#2c2c2e', line: '#48484a' },
];

export function SettingsModeSwitch({ isDark, onToggle }: SettingsModeSwitchProps) {
  return (
    <div role="radiogroup" aria-label="โหมดการแสดงผล" className="grid grid-cols-2 gap-3">
      {MODES.map((mode) => {
        const active = mode.dark === isDark;
        return (
          <button
            key={mode.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (!active) onToggle();
            }}
            className={cn(
              'overflow-hidden rounded-xl text-left transition-shadow',
              active ? 'ring-2 ring-interactive-primary' : 'ring-1 ring-border-subtle hover:ring-border-primary'
            )}
          >
            <div className="flex h-14 gap-1.5 p-2" style={{ backgroundColor: mode.canvas }} aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-1 flex-col gap-1 rounded-md p-1.5" style={{ backgroundColor: mode.card }}>
                  <span className="h-1 w-3/4 rounded-full" style={{ backgroundColor: mode.line }} />
                  <span className="h-1 w-1/2 rounded-full" style={{ backgroundColor: mode.line }} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-surface-card px-3 py-2 text-[13px] text-content-primary">
              <mode.Icon size={14} className="text-content-secondary" />
              {mode.label}
              {active && <span className="ml-auto text-[11px] text-interactive-primary">ใช้อยู่</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
