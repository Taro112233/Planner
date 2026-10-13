// components/MyTasksPage/MyTasksPage.tsx
// "งานของฉัน" — every unfinished card assigned to you, across every plan in
// the workspace, split into the mockup's three due windows.
'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/shared';
import { PlannerTopbar } from '@/components/PlannerShell';
import { useMyTasks } from '@/hooks/useMyTasks';
import { MyTaskRow } from './MyTaskRow';
import { MyTasksPageSkeleton } from './MyTasksPageSkeleton';
import type { MyTaskDto } from '@/types/planner';

const BUCKETS: { key: 'overdue' | 'week' | 'later'; label: string; tone: string }[] = [
  { key: 'overdue', label: 'เลยกำหนด / วันนี้', tone: 'text-content-danger' },
  { key: 'week', label: 'สัปดาห์นี้', tone: 'text-content-warning' },
  { key: 'later', label: 'ถัดไป', tone: 'text-content-tertiary' },
];

export function MyTasksPage() {
  const { data, loading, error } = useMyTasks();

  if (loading && !data) return <MyTasksPageSkeleton />;

  if (!data) {
    return (
      <div className="px-5 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load tasks'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isEmpty = data.openCount === 0;

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar title="งานของฉัน" subtitle="งานที่คุณรับผิดชอบ ทุกแผนงาน" />

      <div className="space-y-3.5 px-5 pb-6 pt-1">
        {isEmpty ? (
          <EmptyState
            title="ยังไม่มีงานที่ค้างอยู่"
            description="งานที่มอบหมายให้คุณจะมาแสดงที่นี่"
          />
        ) : (
          BUCKETS.map((bucket) => {
            const tasks = data[bucket.key] as MyTaskDto[];
            return (
              <section
                key={bucket.key}
                aria-label={bucket.label}
                className="wcard px-4 py-3.5"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-[12.5px] font-semibold text-content-secondary">{bucket.label}</h2>
                  <span className={`text-[11.5px] tabular-nums ${bucket.tone}`}>{tasks.length} งาน</span>
                </div>

                {tasks.length > 0 ? (
                  <ul>
                    {tasks.map((task) => (
                      <MyTaskRow key={task.id} task={task} overdue={bucket.key === 'overdue'} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-1 pb-1 pt-3 text-[12.5px] text-content-tertiary">ไม่มีงานในช่วงนี้</p>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
