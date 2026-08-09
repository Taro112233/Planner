// components/BoardPage/BoardViewSwitcher.tsx
// Segmented control for switching between the four board views. All four
// views read the same BoardDto — this only toggles which one is rendered.
'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type BoardViewMode = 'board' | 'list' | 'calendar' | 'timeline';

const VIEWS: { value: BoardViewMode; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'timeline', label: 'Timeline' },
];

interface BoardViewSwitcherProps {
  value: BoardViewMode;
  onChange: (value: BoardViewMode) => void;
}

export function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as BoardViewMode)}>
      <TabsList>
        {VIEWS.map((view) => (
          <TabsTrigger key={view.value} value={view.value}>
            {view.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
