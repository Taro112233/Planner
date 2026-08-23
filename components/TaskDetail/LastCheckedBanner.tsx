// components/TaskDetail/LastCheckedBanner.tsx
// "ติ๊กล่าสุดโดย …" summary above the activity feed. Derived from the subtask
// tree already in the payload — no extra request.
'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/shared/date-utils';
import { findLatestChecked, initials } from './subtaskAttribution';
import type { SubtaskNodeDto } from '@/types/planner';

interface LastCheckedBannerProps {
  subtasks: SubtaskNodeDto[];
}

export function LastCheckedBanner({ subtasks }: LastCheckedBannerProps) {
  const latest = findLatestChecked(subtasks);

  if (!latest || !latest.checkedByName) {
    return (
      <p className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2.5 text-xs text-content-tertiary">
        ยังไม่มีใครติ๊กงานย่อยในงานนี้
      </p>
    );
  }

  const name = latest.checkedByName;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2.5">
      <CheckCircle2 size={14} className="shrink-0 text-interactive-primary" aria-hidden="true" />
      <Avatar className="h-5 w-5 shrink-0">
        {latest.checkedByAvatarUrl && <AvatarImage src={latest.checkedByAvatarUrl} alt={name} />}
        <AvatarFallback className="text-[9px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <p className="min-w-0 text-xs text-content-secondary">
        ติ๊กล่าสุดโดย <span className="font-medium text-content-primary">{name}</span> —{' '}
        <span className="text-content-primary">&ldquo;{latest.title}&rdquo;</span>
        {latest.checkedAt && (
          <span className="text-content-tertiary"> · {formatRelativeTime(latest.checkedAt)}</span>
        )}
      </p>
    </div>
  );
}
