// components/HomePage/HomePlanProgress.tsx
// "ความคืบหน้าแผนงาน" on the home page, split by group so the reader can see
// which กลุ่ม each plan belongs to. Personal plans (no group) come last.
'use client';

import React from 'react';
import Link from 'next/link';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import type { PlanGroupDto, PlanSummaryDto } from '@/types/planner';

interface HomePlanProgressProps {
  planGroups: PlanGroupDto[];
  plans: PlanSummaryDto[];
}

interface Section {
  key: string;
  label: string;
  color: string | null;
  href: string | null;
  plans: PlanSummaryDto[];
}

export function HomePlanProgress({ planGroups, plans }: HomePlanProgressProps) {
  if (plans.length === 0) {
    return <p className="text-sm text-content-tertiary">ยังไม่มีแผนงาน</p>;
  }

  const sections: Section[] = [
    ...planGroups.map((group) => ({
      key: group.id,
      label: group.name,
      color: group.color,
      href: `/groups/${group.id}`,
      plans: plans.filter((plan) => plan.planGroupId === group.id),
    })),
    {
      key: 'personal',
      label: 'แผนงานส่วนตัว',
      color: null,
      href: null,
      // Also catches a plan whose group is not in the list (e.g. one the
      // viewer is not a member of), so no plan silently disappears.
      plans: plans.filter(
        (plan) => !planGroups.some((group) => group.id === plan.planGroupId)
      ),
    },
  ].filter((section) => section.plans.length > 0);

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.key}>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-content-secondary">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: resolveGroupColor(section.color) }}
              aria-hidden="true"
            />
            {section.href ? (
              <Link href={section.href} className="hover:underline">
                {section.label}
              </Link>
            ) : (
              section.label
            )}
            <span className="text-content-tertiary">· {section.plans.length} แผนงาน</span>
          </div>

          <ul className="space-y-3 border-l border-border-subtle pl-3">
            {section.plans.map((plan) => (
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
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${plan.completionPct}%`,
                        backgroundColor: resolveGroupColor(plan.color),
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
