// components/TaskPage/TaskPageActivity.tsx
// Full paginated activity history — the slide-over only shows the latest 10.
'use client';

import React from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataList } from '@/hooks/useDataList';
import { formatActivity } from '@/components/TaskDetail';
import type { TaskActivityDto } from '@/types/planner';

interface TaskPageActivityProps {
  taskId: string;
}

export function TaskPageActivity({ taskId }: TaskPageActivityProps) {
  const { items, pagination, loading, filters, setFilters } = useDataList<TaskActivityDto>(
    `/api/board/tasks/${taskId}/activity`,
    { page: 1, limit: 20 }
  );

  return (
    <section aria-label="Activity">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-3">Activity</h2>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="animate-spin text-content-tertiary" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-content-tertiary">No activity yet.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((activity) => (
            <div key={activity.id} className="text-xs text-content-secondary leading-relaxed">
              <span className="font-medium text-content-primary">{activity.actorNameSnapshot}</span>{' '}
              {formatActivity(activity)}
              <span className="block text-content-tertiary mt-0.5">
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
          <span className="text-xs text-content-tertiary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setFilters({ page: (filters.page as number) - 1 })}
            >
              <ChevronLeft size={13} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!pagination.hasNextPage}
              onClick={() => setFilters({ page: (filters.page as number) + 1 })}
            >
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
