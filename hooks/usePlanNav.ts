// hooks/usePlanNav.ts
// The sidebar's two data-driven sections: "กลุ่มของฉัน" (plan groups) and
// "แผนงาน" (plans), plus the mutations that create them and move a plan
// between groups.
//
// One hook rather than two so a single refresh keeps both lists — and their
// badge counts — consistent after any mutation.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@/hooks/useMutation';
import type { PlanGroupDto, PlanSummaryDto } from '@/types/planner';
import type { GroupColorKey } from '@/lib/shared/group-colors';

export interface UsePlanNavReturn {
  planGroups: PlanGroupDto[];
  plans: PlanSummaryDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPlan: (name: string, planGroupId?: string | null) => Promise<PlanSummaryDto | null>;
  createPlanGroup: (name: string, color?: GroupColorKey) => Promise<boolean>;
  /** Join a plan to a group, or pass null to leave the group it is in. */
  setPlanGroup: (planId: string, planGroupId: string | null) => Promise<boolean>;
  renamePlan: (planId: string, name: string) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<boolean>;
  deletePlanGroup: (planGroupId: string) => Promise<boolean>;
}

export function usePlanNav(): UsePlanNavReturn {
  const [planGroups, setPlanGroups] = useState<PlanGroupDto[]>([]);
  const [plans, setPlans] = useState<PlanSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useMutation();

  // Only the cold load swaps in a skeleton; later refreshes keep the nav in
  // place, the rule useBoard and useTaskDetail both follow.
  const hasLoadedRef = useRef(false);

  const fetchNav = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);

      const [groupsResponse, plansResponse] = await Promise.all([
        fetch('/api/plan-groups', { credentials: 'include' }),
        fetch('/api/plans', { credentials: 'include' }),
      ]);
      const [groupsJson, plansJson] = await Promise.all([
        groupsResponse.json(),
        plansResponse.json(),
      ]);

      if (!groupsResponse.ok || !groupsJson.success) {
        throw new Error(groupsJson.error ?? 'Failed to load groups');
      }
      if (!plansResponse.ok || !plansJson.success) {
        throw new Error(plansJson.error ?? 'Failed to load plans');
      }

      setPlanGroups(groupsJson.data as PlanGroupDto[]);
      setPlans(plansJson.data as PlanSummaryDto[]);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load navigation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNav();
  }, [fetchNav]);

  const createPlan = useCallback(
    async (name: string, planGroupId: string | null = null) => {
      const created = await mutate<{ name: string; planGroupId: string | null }>('/api/plans', {
        method: 'POST',
        body: { name, planGroupId },
      });
      if (!created) return null;

      // The response carries no counters (a new plan has no cards yet), so
      // refetch rather than guess at the summary shape.
      await fetchNav();
      return created as PlanSummaryDto;
    },
    [mutate, fetchNav]
  );

  const createPlanGroup = useCallback(
    async (name: string, color?: GroupColorKey) => {
      const created = await mutate<{ name: string; color?: GroupColorKey }>('/api/plan-groups', {
        method: 'POST',
        body: { name, color },
      });
      if (!created) return false;
      await fetchNav();
      return true;
    },
    [mutate, fetchNav]
  );

  const setPlanGroup = useCallback(
    async (planId: string, planGroupId: string | null) => {
      // Optimistic: the plan hops sections in the sidebar immediately, and both
      // badge counts move with it.
      setPlans((prev) =>
        prev.map((plan) => (plan.id === planId ? { ...plan, planGroupId } : plan))
      );

      const updated = await mutate<{ planGroupId: string | null }>(`/api/plans/${planId}`, {
        method: 'PATCH',
        body: { planGroupId },
      });

      await fetchNav();
      return Boolean(updated);
    },
    [mutate, fetchNav]
  );

  const renamePlan = useCallback(
    async (planId: string, name: string) => {
      setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, name } : plan)));

      const updated = await mutate<{ name: string }>(`/api/plans/${planId}`, {
        method: 'PATCH',
        body: { name },
      });
      if (!updated) {
        await fetchNav();
        return false;
      }
      return true;
    },
    [mutate, fetchNav]
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      const result = await mutate(`/api/plans/${planId}`, { method: 'DELETE' });
      if (!result) return false;
      await fetchNav();
      return true;
    },
    [mutate, fetchNav]
  );

  const deletePlanGroup = useCallback(
    async (planGroupId: string) => {
      const result = await mutate(`/api/plan-groups/${planGroupId}`, { method: 'DELETE' });
      if (!result) return false;
      await fetchNav();
      return true;
    },
    [mutate, fetchNav]
  );

  return {
    planGroups,
    plans,
    loading,
    error,
    refetch: fetchNav,
    createPlan,
    createPlanGroup,
    setPlanGroup,
    renamePlan,
    deletePlan,
    deletePlanGroup,
  };
}
