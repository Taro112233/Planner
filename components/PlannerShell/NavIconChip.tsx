// components/PlannerShell/NavIconChip.tsx
// The mockup's 22px rounded-square nav glyph: a tinted chip with a white icon
// (`.av` in Planner v2.dc.html). Plans use a smaller bare square instead.
'use client';

import React from 'react';

interface NavIconChipProps {
  /** Any CSS color — usually a resolved group palette token. */
  color: string;
  children: React.ReactNode;
}

export function NavIconChip({ color, children }: NavIconChipProps) {
  return (
    <span
      className="flex size-[22px] shrink-0 items-center justify-center rounded-md text-[11.5px] text-white"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
