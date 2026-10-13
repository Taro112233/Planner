// components/ReportsPage/ReportsPage.tsx
// "รายงาน" — four cards from the mockup: workload per member, cards per
// column across every plan, who ticks the most, and ticks per day.
'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerPageSkeleton, PlannerTopbar } from '@/components/PlannerShell';
import { useApiResource } from '@/hooks/useApiResource';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import type { ReportDto } from '@/types/planner';
import { ReportBarRow, ReportCard, ReportPerson } from './ReportParts';

export function ReportsPage() {
  const { scopeQuery } = usePlannerScope();
  const { data, loading, error } = useApiResource<ReportDto>(
    scopeQuery ? `/api/reports?${scopeQuery}` : '/api/reports'
  );

  if (loading && !data) return <PlannerPageSkeleton />;

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar showScope title="รายงาน" subtitle="ภาระงาน ความคืบหน้า และสถิติการติ๊กงาน" />

      <div className="px-5 pb-6 pt-1">
        {!data ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error ?? 'โหลดรายงานไม่สำเร็จ'}</AlertDescription>
          </Alert>
        ) : (
          <ReportGrid report={data} />
        )}
      </div>
    </div>
  );
}

function ReportGrid({ report }: { report: ReportDto }) {
  const maxOpen = Math.max(1, ...report.workload.map((row) => row.openCount));
  const maxColumn = Math.max(1, ...report.columns.map((row) => row.count));
  const maxDay = Math.max(1, ...report.dailyTicks.map((day) => day.count));

  return (
    <div className="grid items-start gap-3.5 lg:grid-cols-2">
      <ReportCard title="ภาระงานต่อคน (งานที่ยังไม่เสร็จ)" empty={report.workload.length === 0}>
        {report.workload.map((row) => (
          <ReportBarRow
            key={row.organizationUserId}
            label={<ReportPerson name={row.name} avatarUrl={row.avatarUrl} />}
            pct={(row.openCount / maxOpen) * 100}
            color="var(--color-interactive-primary)"
            value={`${row.openCount} งาน`}
          />
        ))}
      </ReportCard>

      <ReportCard title="งานตามหัวข้อ (ทุกแผนงาน)" empty={report.columns.length === 0}>
        {report.columns.map((row) => (
          <ReportBarRow
            key={row.name}
            label={
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: resolveGroupColor(row.color) }}
                />
                <span className="truncate">{row.name}</span>
              </span>
            }
            pct={(row.count / maxColumn) * 100}
            color={resolveGroupColor(row.color)}
            value={String(row.count)}
          />
        ))}
      </ReportCard>

      <ReportCard
        title={`ใครติ๊กงานเสร็จมากที่สุด (${report.tickerWindowDays} วันล่าสุด)`}
        empty={report.topTickers.length === 0}
      >
        {report.topTickers.map((row) => (
          <div key={row.organizationUserId} className="flex items-center gap-2.5">
            <ReportPerson name={row.name} avatarUrl={row.avatarUrl} grow />
            <span className="text-[12.5px] font-semibold tabular-nums text-content-primary">
              {row.count}
            </span>
            <span className="text-[11px] text-content-tertiary">ครั้ง</span>
          </div>
        ))}
      </ReportCard>

      <ReportCard title="งานย่อยที่ติ๊กเสร็จต่อวัน (7 วันล่าสุด)">
        <div className="flex h-[150px] items-end gap-3" role="img" aria-label="กราฟจำนวนการติ๊กต่อวัน">
          {report.dailyTicks.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] tabular-nums text-content-tertiary">{day.count}</span>
              <span
                className="w-full rounded-t-md"
                style={{
                  height: `${Math.max(4, (day.count / maxDay) * 100)}px`,
                  backgroundColor: 'var(--color-chart-1)',
                  opacity: day.count === 0 ? 0.25 : 1,
                }}
              />
              <span className="text-[11px] text-content-tertiary">
                {new Date(day.date).toLocaleDateString('th-TH', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </ReportCard>
    </div>
  );
}
