// components/HomePage/StatTile.tsx
// One counter tile from the mockup: label, big number, hint.
'use client';

import React from 'react';

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
}

const TONE_CLASS: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-content-primary',
  danger: 'text-content-danger',
  warning: 'text-content-warning',
  success: 'text-alert-success-icon',
};

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="wcard px-3.5 py-3">
      <p className="text-[11.5px] text-content-tertiary">{label}</p>
      <p className={`text-[26px] font-bold leading-tight tracking-tight tabular-nums ${TONE_CLASS[tone]}`}>{value}</p>
      <p className="text-[11px] text-content-tertiary">{hint}</p>
    </div>
  );
}
