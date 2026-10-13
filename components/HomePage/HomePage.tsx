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
import { useHomeSummary } from '@/hooks/useHomeSummary';
import { usePlanNav } from '@/hooks/usePlanNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { HomePageSkeleton } from './HomePageSkeleton';
import { StatTile } from './StatTile';
import { HomePlanProgress } from './HomePlanProgress';

export function HomePage() {
  const { data, loading, error } = useHomeSummary();
  const { planGroups, plans } = usePlanNav();
  const { user } = useCurrentUser();

  if (loading && !data) return <HomePageSkeleton />;

  if (!data) {
    return (
      <div className="px-5 py-6">
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
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar title="หน้าแรก" subtitle={subtitle} />

      <div className="space-y-3.5 px-5 pb-6 pt-1">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

        <div className="grid items-start gap-3.5 lg:grid-cols-[1.35fr_1fr]">
          <section aria-label="ครบกำหนดเร็ว ๆ นี้" className="wcard px-4 py-3.5">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-[12.5px] font-semibold text-content-secondary">ครบกำหนดเร็ว ๆ นี้</h2>
              <span className="flex-1" />
              <span className="text-[11.5px] text-content-tertiary">ทุกแผนงาน</span>
            </div>

            {data.dueSoon.length > 0 ? (
              <ul>
                {data.dueSoon.map((task) => (
                  <MyTaskRow
                    key={task.id}
                    task={task}
                    overdue={task.dueDate !== null && new Date(task.dueDate).getTime() < now}
                  />
                ))}
              </ul>
            ) : (
              <p className="py-3 text-xs text-content-tertiary">ยังไม่มีงานที่ใกล้ครบกำหนด</p>
            )}
          </section>

          <div className="flex flex-col gap-3.5">
            <section aria-label="ความคืบหน้าแผนงาน" className="wcard px-4 py-3.5">
              <h2 className="mb-3 text-[12.5px] font-semibold text-content-secondary">
                ความคืบหน้าแผนงาน
              </h2>
              <HomePlanProgress planGroups={planGroups} plans={plans} />
            </section>

            <section aria-label="กิจกรรมล่าสุด" className="wcard px-4 py-3.5">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[12.5px] font-semibold text-content-secondary">กิจกรรมล่าสุด</h2>
                <span className="flex-1" />
                <Link href="/audit" className="text-[11.5px] text-interactive-primary hover:underline">
                  ดูทั้งหมด ›
                </Link>
              </div>
              <TaskActivityFeed items={data.activities} emptyLabel="ยังไม่มีกิจกรรม" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
