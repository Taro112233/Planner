// components/HomePage/HomePage.tsx
// "หน้าแรก" — four counters, what is due next across every plan, how each plan
// is progressing, and what the workspace has been doing lately.
'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerTopbar } from '@/components/PlannerShell';
import { TaskActivityFeed } from '@/components/TaskDetail';
import { MyTaskRow } from '@/components/MyTasksPage';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { useHomeSummary } from '@/hooks/useHomeSummary';
import { usePlanNav } from '@/hooks/usePlanNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { HomePageSkeleton } from './HomePageSkeleton';
import { StatTile } from './StatTile';

export function HomePage() {
  const { data, loading, error } = useHomeSummary();
  const { plans } = usePlanNav();
  const { user } = useCurrentUser();

  if (loading && !data) return <HomePageSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load home'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const now = Date.now();
  const subtitle = user ? `ภาพรวมงานของคุณวันนี้ · ${user.fullName}` : 'ภาพรวมงานของคุณวันนี้';

  return (
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar title="หน้าแรก" subtitle={subtitle} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="งานของฉันที่ค้าง" value={data.myOpenCount} hint="ทุกแผนงาน" />
          <StatTile
            label="เลยกำหนด"
            value={data.myOverdueCount}
            hint="ต้องจัดการก่อน"
            tone="danger"
          />
          <StatTile
            label="งานค้าง (ทั้งทีม)"
            value={data.teamOpenCount}
            hint="ทุกแผนงาน"
            tone="warning"
          />
          <StatTile
            label="ติ๊กเสร็จวันนี้"
            value={data.checkedTodayCount}
            hint="จากประวัติกิจกรรม"
            tone="success"
          />
        </div>

        <section
          aria-label="ครบกำหนดเร็ว ๆ นี้"
          className="rounded-xl border border-border-subtle bg-surface-secondary"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              ครบกำหนดเร็ว ๆ นี้
            </h2>
            <span className="text-[11px] text-content-tertiary">ทุกแผนงาน</span>
          </div>

          {data.dueSoon.length > 0 ? (
            <ul className="p-1.5">
              {data.dueSoon.map((task) => (
                <MyTaskRow
                  key={task.id}
                  task={task}
                  overdue={task.dueDate !== null && new Date(task.dueDate).getTime() < now}
                />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-xs text-content-tertiary">ยังไม่มีงานที่ใกล้ครบกำหนด</p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="ความคืบหน้าแผนงาน">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              ความคืบหน้าแผนงาน
            </h2>

            {plans.length > 0 ? (
              <ul className="space-y-3">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <Link href={`/plans/${plan.id}`} className="group block">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ backgroundColor: resolveGroupColor(plan.color) }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-content-primary group-hover:underline">
                          {plan.name}
                        </span>
                        <span className="text-[11px] text-content-tertiary tabular-nums">
                          {plan.completionPct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                        <div
                          className="h-full rounded-full bg-interactive-primary transition-all duration-500"
                          style={{ width: `${plan.completionPct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-content-tertiary">ยังไม่มีแผนงาน</p>
            )}
          </section>

          <section aria-label="กิจกรรมล่าสุด">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              กิจกรรมล่าสุด
            </h2>
            <TaskActivityFeed items={data.activities} emptyLabel="ยังไม่มีกิจกรรม" />
          </section>
        </div>
      </div>
    </div>
  );
}
