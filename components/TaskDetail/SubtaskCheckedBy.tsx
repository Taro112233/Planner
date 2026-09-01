// components/TaskDetail/SubtaskCheckedBy.tsx
// Per-row tick attribution: who checked a subtask and when. The data comes
// from the snapshot columns setSubtaskDone stamps, so it survives the member
// leaving the organization.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/shared/date-utils';
import { initials } from './subtaskAttribution';

interface SubtaskCheckedByProps {
  isDone: boolean;
  name: string | null;
  avatarUrl: string | null;
  /** ISO timestamp; null whenever the subtask is not done. */
  checkedAt: string | null;
}

export function SubtaskCheckedBy({ isDone, name, avatarUrl, checkedAt }: SubtaskCheckedByProps) {
  // A plain `title` rather than components/ui/tooltip.tsx on purpose: that
  // component wraps each instance in its own TooltipProvider, which would mean
  // one provider per checklist row.
  if (!isDone) {
    return (
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-dashed border-border-subtle"
        title="ยังไม่เสร็จ"
        aria-hidden="true"
      />
    );
  }

  // Ticked, but the server's snapshot hasn't landed yet (optimistic update):
  // render nothing rather than the "not done" marker.
  if (!name) return null;

  const when = checkedAt ? formatRelativeTime(checkedAt) : null;

  return (
    <span
      className="flex items-center gap-1.5 shrink-0"
      title={`ติ๊กโดย ${name}${checkedAt ? ` · ${new Date(checkedAt).toLocaleString()}` : ''}`}
    >
      <Avatar className="h-4 w-4">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-[8px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="text-[10px] text-content-tertiary tabular-nums">
        {initials(name)}
        {when ? ` · ${when}` : ''}
      </span>
    </span>
  );
}
