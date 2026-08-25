// components/PlanGroupPage/PlanGroupPage.tsx
// Group overview: the plans inside a group with their progress, who is in the
// workspace and how much is on their plate, and what happened recently across
// the group's plans.
'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared';
import { PlannerTopbar } from '@/components/PlannerShell';
import { TaskActivityFeed } from '@/components/TaskDetail';
import { usePlanGroupOverview } from '@/hooks/usePlanGroupOverview';
import { usePlanNav } from '@/hooks/usePlanNav';
import { PlanGroupPageSkeleton } from './PlanGroupPageSkeleton';
import type { PlanGroupJoinSettingsDto } from '@/types/planner';
import { PlanCard } from './PlanCard';
import { PlanGroupMemberList } from './PlanGroupMemberList';
import { JoinCodePanel } from './JoinCodePanel';

interface PlanGroupPageProps {
  planGroupId: string;
}

export function PlanGroupPage({ planGroupId }: PlanGroupPageProps) {
  const { overview, loading, error, refetch } = usePlanGroupOverview(planGroupId);
  const { setPlanGroup, createPlan } = usePlanNav();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Seeded from the overview payload, then owned locally once the owner acts.
  const [joinSettings, setJoinSettings] = useState<PlanGroupJoinSettingsDto | null>(null);

  if (loading && !overview) return <PlanGroupPageSkeleton />;

  if (!overview) {
    return (
      <div className="px-5 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load group'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { planGroup, members, activities } = overview;

  const handleCreatePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    try {
      const created = await createPlan(name, planGroupId);
      if (!created) {
        toast.error('สร้างแผนงานไม่สำเร็จ');
        return;
      }
      setDraft('');
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async (planId: string) => {
    const ok = await setPlanGroup(planId, null);
    if (!ok) {
      toast.error('เอาแผนงานออกจากกลุ่มไม่สำเร็จ');
      return;
    }
    await refetch();
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar
        title={planGroup.name}
        subtitle={`${overview.plans.length} แผนงาน · ${members.length} สมาชิก`}
      />

      <div className="space-y-6 px-5 py-5">
        <section aria-label="แผนงานในกลุ่มนี้" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              แผนงานในกลุ่มนี้
            </h2>
            <form onSubmit={handleCreatePlan} className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="ชื่อแผนงานใหม่"
                disabled={submitting}
                className="h-8 w-48 text-sm"
              />
              <Button type="submit" size="sm" disabled={submitting || !draft.trim()}>
                เพิ่มแผนงาน
              </Button>
            </form>
          </div>

          {overview.plans.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {overview.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onLeaveGroup={() => handleLeave(plan.id)} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="ยังไม่มีแผนงานในกลุ่มนี้"
              description="สร้างแผนงานใหม่ หรือย้ายแผนงานที่มีอยู่เข้ามา"
            />
          )}
        </section>

        <JoinCodePanel
          planGroupId={planGroupId}
          settings={joinSettings ?? overview.joinSettings ?? null}
          onChange={setJoinSettings}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="สมาชิกในกลุ่มนี้">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              สมาชิกในกลุ่มนี้
            </h2>
            <PlanGroupMemberList members={members} />
          </section>

          <section aria-label="กิจกรรมในกลุ่ม">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              กิจกรรมในกลุ่ม
            </h2>
            <TaskActivityFeed items={activities} emptyLabel="ยังไม่มีกิจกรรมในกลุ่มนี้" />
          </section>
        </div>
      </div>
    </div>
  );
}
