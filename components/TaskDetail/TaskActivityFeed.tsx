// components/TaskDetail/TaskActivityFeed.tsx
// Activity rows, shared by the slide-over (latest 10, straight off the task
// payload) and TaskPageActivity (paginated). This file owns the row markup;
// pagination stays with the caller.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatActivity } from './activityFormat';
import { initials } from './subtaskAttribution';
import type { TaskActivityDto } from '@/types/planner';

interface TaskActivityFeedProps {
  items: TaskActivityDto[];
  /** Rendered when there is nothing to show. Omit to render nothing at all. */
  emptyLabel?: string;
}

export function TaskActivityFeed({ items, emptyLabel }: TaskActivityFeedProps) {
  if (items.length === 0) {
    return emptyLabel ? <p className="text-sm text-content-tertiary">{emptyLabel}</p> : null;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2">
          <Avatar className="mt-0.5 h-5 w-5 shrink-0">
            {activity.actorAvatarUrl && (
              <AvatarImage src={activity.actorAvatarUrl} alt={activity.actorNameSnapshot} />
            )}
            <AvatarFallback className="text-[9px]">
              {initials(activity.actorNameSnapshot)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-xs leading-relaxed text-content-secondary">
            <span className="font-medium text-content-primary">{activity.actorNameSnapshot}</span>{' '}
            {formatActivity(activity)}
            <span className="mt-0.5 block text-content-tertiary">
              {new Date(activity.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
