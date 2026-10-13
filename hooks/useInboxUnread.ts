// hooks/useInboxUnread.ts
// Unread count for the sidebar's "การแจ้งเตือน" badge: inbox items newer than
// the per-browser "seen up to" stamp. Shares the cached /api/inbox response
// with the inbox page, refreshes on navigation at most once a minute, and
// clears as soon as the inbox page marks everything read.

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { INBOX_SEEN_EVENT, readInboxSeenAt } from '@/lib/client/inbox-read-state';
import type { InboxItemDto } from '@/types/planner';

const REFRESH_INTERVAL_MS = 60_000;

export function useInboxUnread(): number {
  const pathname = usePathname();
  const { data, refetch } = useApiResource<InboxItemDto[]>('/api/inbox');
  const [seenAt, setSeenAt] = useState(0);
  const lastRefresh = useRef(Date.now());

  useEffect(() => setSeenAt(readInboxSeenAt()), []);

  // The mount already fetched; after that, only refresh on navigation once
  // the last refresh is a minute old.
  useEffect(() => {
    if (Date.now() - lastRefresh.current < REFRESH_INTERVAL_MS) return;
    lastRefresh.current = Date.now();
    void refetch();
  }, [pathname, refetch]);

  useEffect(() => {
    const onSeen = () => setSeenAt(readInboxSeenAt());
    window.addEventListener(INBOX_SEEN_EVENT, onSeen);
    return () => window.removeEventListener(INBOX_SEEN_EVENT, onSeen);
  }, []);

  return (data ?? []).filter((item) => new Date(item.createdAt).getTime() > seenAt).length;
}
