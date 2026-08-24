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
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <p className="text-[11px] text-content-tertiary">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${TONE_CLASS[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-content-tertiary">{hint}</p>
    </div>
  );
}
