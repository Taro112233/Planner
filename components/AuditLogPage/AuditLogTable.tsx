// components/AuditLogPage/AuditLogTable.tsx
// The mockup's five-column log: เวลา · ผู้ใช้ · การกระทำ · รายละเอียด · แผนงาน.
// Below md the header drops away and each row stacks.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail/subtaskAttribution';
import type { AuditEntryDto } from '@/types/planner';
import { ROLE_LABELS, auditVerb } from '@/lib/shared/activity-labels';

const GRID = 'md:grid md:grid-cols-[118px_190px_128px_1fr_132px] md:items-center md:gap-2.5';

function detail(entry: AuditEntryDto): string {
  if (entry.taskTitle && entry.targetTitle && entry.taskTitle !== entry.targetTitle) {
    return `${entry.targetTitle} — ใน "${entry.taskTitle}"`;
  }
  return entry.targetTitle ?? entry.taskTitle ?? '—';
}

export function AuditLogTable({ items }: { items: AuditEntryDto[] }) {
  return (
    <div className="overflow-hidden wcard">
      <div className={`hidden bg-surface-secondary px-4 py-2.5 text-[11px] font-semibold text-content-tertiary ${GRID}`}>
        <span>เวลา</span>
        <span>ผู้ใช้</span>
        <span>การกระทำ</span>
        <span>รายละเอียด</span>
        <span>แผนงาน</span>
      </div>

      {items.map((entry) => {
        const verb = auditVerb(entry.action);
        return (
          <div
            key={entry.id}
            className={`flex flex-col gap-1.5 border-t border-border-subtle px-4 py-[11px] text-[12.5px] ${GRID}`}
          >
            <span className="text-[11px] tabular-nums text-content-tertiary">
              {new Date(entry.createdAt).toLocaleString('th-TH', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            <span className="flex min-w-0 items-center gap-2">
              <Avatar className="h-5 w-5 shrink-0">
                {entry.actorAvatarUrl && (
                  <AvatarImage src={entry.actorAvatarUrl} alt={entry.actorNameSnapshot} />
                )}
                <AvatarFallback className="text-[9px]">
                  {initials(entry.actorNameSnapshot)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-content-primary">{entry.actorNameSnapshot}</span>
                <span className="block text-[10.5px] text-content-tertiary">
                  {ROLE_LABELS[entry.actorRoleSnapshot]}
                </span>
              </span>
            </span>

            <span>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: verb.color,
                  backgroundColor: `color-mix(in oklch, ${verb.color} 14%, transparent)`,
                }}
              >
                {verb.label}
              </span>
            </span>

            <span className="min-w-0 break-words leading-snug text-content-secondary">
              {detail(entry)}
            </span>

            <span className="truncate text-[11px] text-content-tertiary">{entry.planName ?? '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
