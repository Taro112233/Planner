// components/ReportsPage/ReportParts.tsx
// Building blocks shared by the four report cards.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail';

export function ReportCard({
  title,
  empty = false,
  children,
}: {
  title: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="wcard px-4 py-3.5">
      <h2 className="text-[12.5px] font-semibold text-content-secondary">{title}</h2>
      <div className="mt-3 flex flex-col gap-[11px]">
        {empty ? <p className="text-xs text-content-tertiary">ยังไม่มีข้อมูล</p> : children}
      </div>
    </section>
  );
}

export function ReportPerson({
  name,
  avatarUrl,
  grow = false,
}: {
  name: string;
  avatarUrl: string | null;
  grow?: boolean;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${grow ? 'flex-1' : ''}`}>
      <Avatar className="size-[26px] shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-[12.5px] text-content-primary">{name}</span>
    </span>
  );
}

export function ReportBarRow({
  label,
  pct,
  color,
  value,
}: {
  label: React.ReactNode;
  pct: number;
  color: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <div className="w-32 shrink-0">{label}</div>
      <span className="h-[9px] flex-1 overflow-hidden rounded-full bg-surface-tertiary">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-14 shrink-0 text-right text-[11.5px] tabular-nums text-content-tertiary">
        {value}
      </span>
    </div>
  );
}
