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
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar title="งานของฉัน" subtitle="งานที่คุณรับผิดชอบ ทุกแผนงาน" />

      <div className="space-y-5 px-5 py-5">
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
                className="rounded-xl border border-border-subtle bg-surface-secondary"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
                  <h2 className={`text-xs font-semibold ${bucket.tone}`}>{bucket.label}</h2>
                  <span className="text-[11px] text-content-tertiary tabular-nums">
                    {tasks.length} งาน
                  </span>
                </div>

                {tasks.length > 0 ? (
                  <ul className="p-1.5">
                    {tasks.map((task) => (
                      <MyTaskRow key={task.id} task={task} overdue={bucket.key === 'overdue'} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-xs text-content-tertiary">ไม่มีงานในช่วงนี้</p>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
