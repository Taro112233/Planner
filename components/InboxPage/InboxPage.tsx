// components/InboxPage/InboxPage.tsx
// "การแจ้งเตือน" — what other members did to cards assigned to you. Read state
// is per browser: "อ่านทั้งหมด" stamps the time, and anything newer is unread.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlannerPageSkeleton, PlannerTopbar } from '@/components/PlannerShell';
import { EmptyState } from '@/components/shared';
import { initials } from '@/components/TaskDetail';
import { useApiResource } from '@/hooks/useApiResource';
import { formatRelativeTime } from '@/lib/shared/date-utils';
import { auditVerb } from '@/lib/shared/activity-labels';
import type { InboxItemDto } from '@/types/planner';
import { readInboxSeenAt, writeInboxSeenAt } from '@/lib/client/inbox-read-state';

export function InboxPage() {
  const { data, loading, error } = useApiResource<InboxItemDto[]>('/api/inbox');
  // Read after mount: localStorage does not exist during the server render.
  const [seenAt, setSeenAt] = useState<number | null>(null);
  useEffect(() => setSeenAt(readInboxSeenAt()), []);

  if (loading && !data) return <PlannerPageSkeleton cards={1} />;

  const items = data ?? [];
  const unread = items.filter((item) => new Date(item.createdAt).getTime() > (seenAt ?? 0)).length;

  const markAllRead = () => setSeenAt(writeInboxSeenAt());

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar
        title="การแจ้งเตือน"
        subtitle={unread > 0 ? `ยังไม่ได้อ่าน ${unread} รายการ` : 'ใครทำอะไรที่เกี่ยวกับคุณ'}
      />

      <div className="space-y-3 px-5 pb-6 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1 text-xs text-content-secondary transition-colors hover:bg-surface-interactive disabled:opacity-50"
          >
            <CheckCheck size={13} />
            อ่านทั้งหมด
          </button>
          <span className="text-xs text-content-tertiary">
            แจ้งเตือนเมื่อมีคนติ๊ก ย้าย หรือแก้ไขงานที่คุณรับผิดชอบ
          </span>
        </div>

        {error && !data ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <EmptyState
            title="ยังไม่มีการแจ้งเตือน"
            description="เมื่อมีคนทำอะไรกับงานที่คุณรับผิดชอบ จะมาแสดงที่นี่"
          />
        ) : (
          <ul className="wcard px-4 pb-3 pt-1.5">
            {items.map((item) => (
              <InboxRow
                key={item.id}
                item={item}
                unread={new Date(item.createdAt).getTime() > (seenAt ?? 0)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InboxRow({ item, unread }: { item: InboxItemDto; unread: boolean }) {
  const verb = auditVerb(item.action);
  const subject = item.targetTitle && item.targetTitle !== item.taskTitle ? ` "${item.targetTitle}"` : '';
  const body = (
    <>
      <span
        className="mt-[7px] size-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: unread ? 'var(--color-interactive-primary)' : 'transparent' }}
        aria-label={unread ? 'ยังไม่ได้อ่าน' : undefined}
      />
      <Avatar className="size-[26px] shrink-0">
        {item.actorAvatarUrl && <AvatarImage src={item.actorAvatarUrl} alt={item.actorNameSnapshot} />}
        <AvatarFallback className="text-[10px]">{initials(item.actorNameSnapshot)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed">
        <span className={unread ? 'font-semibold text-content-primary' : 'text-content-primary'}>
          {item.actorNameSnapshot}
        </span>{' '}
        <span className="text-content-secondary">
          {verb.label}
          {subject} ใน &ldquo;{item.taskTitle ?? 'งานที่ถูกลบ'}&rdquo;
        </span>
        <span className="block text-[11px] text-content-tertiary">
          {formatRelativeTime(item.createdAt)}
          {item.planName ? ` · ${item.planName}` : ''}
        </span>
      </span>
    </>
  );

  return (
    <li className="border-t border-border-subtle first:border-t-0">
      {item.taskItemId ? (
        <Link
          href={`/board/tasks/${item.taskItemId}`}
          className="flex items-start gap-[11px] px-1 py-3 transition-colors hover:bg-surface-secondary"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-[11px] px-1 py-3">{body}</div>
      )}
    </li>
  );
}
