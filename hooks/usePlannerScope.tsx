// hooks/usePlannerScope.tsx
// Which group ("กลุ่ม") the user is working in — or none, meaning
// "Workspace ของฉัน". The scope follows the URL when the URL says something
// (/groups/[id], or a plan inside a group) and is otherwise remembered, so
// opening รายงาน, ประวัติตรวจสอบ, ถังขยะ, … from inside a group keeps
// showing that group's data instead of resetting.
//
// Remembered per browser across reloads. A remembered group that no longer
// exists (deleted, or another workspace) falls back to no scope.

'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePlanNav } from '@/hooks/usePlanNav';
import type { PlanGroupDto } from '@/types/planner';

const STORAGE_KEY = 'planner-scope-group';

export interface PlannerScope {
  /** The group in scope; null for the whole workspace / personal plans. */
  scopeGroupId: string | null;
  scopeGroup: PlanGroupDto | null;
  setScopeGroupId: (planGroupId: string | null) => void;
  /** `?planGroupId=…` for scope-aware endpoints, or '' with no scope. */
  scopeQuery: string;
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function writeStored(value: string | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not persisted — the scope still holds for this session.
  }
}

const ScopeContext = createContext<PlannerScope | null>(null);

export function PlannerScopeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { planGroups, plans, loading } = usePlanNav();
  const [scopeGroupId, setScopeState] = useState<string | null>(null);

  // Read after mount: localStorage does not exist during the server render.
  useEffect(() => setScopeState(readStored()), []);

  const setScopeGroupId = useCallback((planGroupId: string | null) => {
    setScopeState(planGroupId);
    writeStored(planGroupId);
  }, []);

  // The URL wins whenever it names a group.
  useEffect(() => {
    const groupMatch = pathname.match(/^\/groups\/([^/]+)/);
    if (groupMatch) {
      setScopeGroupId(groupMatch[1]);
      return;
    }
    const planMatch = pathname.match(/^\/plans\/([^/]+)/);
    if (planMatch) {
      const plan = plans.find((candidate) => candidate.id === planMatch[1]);
      if (plan) setScopeGroupId(plan.planGroupId);
    }
  }, [pathname, plans, setScopeGroupId]);

  // Drop a remembered group that is not in this workspace (any more).
  useEffect(() => {
    if (!loading && scopeGroupId && !planGroups.some((group) => group.id === scopeGroupId)) {
      setScopeGroupId(null);
    }
  }, [loading, planGroups, scopeGroupId, setScopeGroupId]);

  const value = useMemo<PlannerScope>(() => {
    const scopeGroup = planGroups.find((group) => group.id === scopeGroupId) ?? null;
    return {
      scopeGroupId: scopeGroup ? scopeGroup.id : null,
      scopeGroup,
      setScopeGroupId,
      scopeQuery: scopeGroup ? `planGroupId=${encodeURIComponent(scopeGroup.id)}` : '',
    };
  }, [planGroups, scopeGroupId, setScopeGroupId]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function usePlannerScope(): PlannerScope {
  const context = useContext(ScopeContext);
  if (!context) throw new Error('usePlannerScope must be used inside <PlannerScopeProvider>');
  return context;
}
