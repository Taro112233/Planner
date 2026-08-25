// components/PlannerShell/PlannerSidebar.tsx
// Left nav, following the mockup's structure (Planner v2.dc.html): a search
// box, the main destinations, "กลุ่มของฉัน", "แผนงาน", "การจัดการ", and the
// user chip in the footer.
//
// Destinations whose pages don't exist yet (การแจ้งเตือน, รายงาน,
// ประวัติตรวจสอบ, สมาชิก & สิทธิ์, เทมเพลต) render as disabled rows so
// the rail matches the mockup without shipping dead links — the same call the
// search box already makes.
'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Search, UserPlus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlanNav } from '@/hooks/usePlanNav';
import type { PlanSummaryDto } from '@/types/planner';
import { NavStaticSection, type StaticNavItem } from './NavStaticSection';
import { PlanNavSection, planGroupToNavItem, planToNavItem } from './PlanNavSection';
import { JoinGroupDialog } from './JoinGroupDialog';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
}

// Colors mirror the mockup's chips (#007aff, #ff9500, #ff2d55, …) via the
// accent-independent group palette, so they hold up in both themes.
const MAIN_NAV: StaticNavItem[] = [
  { key: 'home', label: 'หน้าแรก', icon: '⌂', color: 'var(--color-group-blue)', href: '/home' },
  {
    key: 'mine',
    label: 'งานของฉัน',
    icon: '✓',
    color: 'var(--color-group-orange)',
    href: '/my-tasks',
  },
  { key: 'inbox', label: 'การแจ้งเตือน', icon: '✉', color: 'var(--color-group-pink)' },
];

const ADMIN_NAV: StaticNavItem[] = [
  { key: 'reports', label: 'รายงาน', icon: '▤', color: 'var(--color-group-teal)' },
  { key: 'audit', label: 'ประวัติตรวจสอบ', icon: '◔', color: 'var(--color-group-purple)' },
  { key: 'members', label: 'สมาชิก & สิทธิ์', icon: '⚿', color: 'var(--color-group-slate)' },
  { key: 'templates', label: 'เทมเพลต', icon: '⌗', color: 'var(--color-group-green)' },
  {
    key: 'trash',
    label: 'ถังขยะ',
    icon: '🗑',
    color: 'var(--color-group-slate)',
    href: '/board/trash',
  },
];

/**
 * The group the user is working in, read straight off the URL: /groups/[id],
 * or the group owning the plan at /plans/[id]. Null everywhere else (home, my
 * tasks, trash), where the plan list falls back to ungrouped plans.
 */
function useActiveGroupId(pathname: string, plans: PlanSummaryDto[]): string | null {
  const groupMatch = pathname.match(/^\/groups\/([^/]+)/);
  if (groupMatch) return groupMatch[1];

  const planMatch = pathname.match(/^\/plans\/([^/]+)/);
  if (planMatch) {
    return plans.find((plan) => plan.id === planMatch[1])?.planGroupId ?? null;
  }

  return null;
}

export function PlannerSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const {
    planGroups,
    plans,
    createPlan,
    createPlanGroup,
    setPlanGroup,
    deletePlan,
    deletePlanGroup,
    refetch,
  } = usePlanNav();
  const [joining, setJoining] = useState(false);

  const activeGroupId = useActiveGroupId(pathname, plans);
  const activeGroup = planGroups.find((group) => group.id === activeGroupId) ?? null;
  // Inside a group you see that group's plans; outside it, the ones that
  // belong to no group at all.
  const visiblePlans = plans.filter((plan) => plan.planGroupId === activeGroupId);

  return (
    // AppHeader is hidden on planner routes (components/shared/AppHeader.tsx),
    // so the rail uses the primitive's default full-height fixed positioning.
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="relative px-1 py-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-content-tertiary" />
          <SidebarInput placeholder="ค้นหางาน / งานย่อย" className="pl-8" disabled />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <NavStaticSection items={MAIN_NAV} activeHref={pathname} />

        <PlanNavSection
          label="กลุ่มของฉัน"
          addLabel="สร้างกลุ่มใหม่"
          addPlaceholder="ชื่อกลุ่ม แล้วกด Enter"
          variant="chip"
          items={planGroups.map(planGroupToNavItem)}
          activeHref={pathname}
          onAdd={async (name) => {
            const ok = await createPlanGroup(name);
            if (!ok) toast.error('สร้างกลุ่มไม่สำเร็จ');
          }}
          onDelete={async (planGroupId) => {
            const ok = await deletePlanGroup(planGroupId);
            toast[ok ? 'success' : 'error'](
              ok ? 'ลบกลุ่มแล้ว — แผนงานข้างในยังอยู่' : 'ลบกลุ่มไม่สำเร็จ'
            );
          }}
          footer={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-start gap-2 px-2 text-xs text-content-tertiary group-data-[collapsible=icon]:hidden"
              onClick={() => setJoining(true)}
            >
              <UserPlus size={13} />
              เข้าร่วมด้วยรหัส
            </Button>
          }
        />

        <PlanNavSection
          label={activeGroup ? `แผนงานใน ${activeGroup.name}` : 'แผนงาน'}
          addLabel="สร้างแผนงานใหม่"
          addPlaceholder="ชื่อแผนงาน แล้วกด Enter"
          variant="square"
          items={visiblePlans.map(planToNavItem)}
          activeHref={pathname}
          moveTargets={planGroups}
          onAdd={async (name) => {
            // A new plan lands in whichever group you are looking at, so the
            // list you just added to is the list it appears in.
            const created = await createPlan(name, activeGroupId);
            if (!created) toast.error('สร้างแผนงานไม่สำเร็จ');
          }}
          onMoveToGroup={async (planId, planGroupId) => {
            const ok = await setPlanGroup(planId, planGroupId);
            if (!ok) toast.error('ย้ายแผนงานไม่สำเร็จ');
          }}
          onDelete={async (planId) => {
            const ok = await deletePlan(planId);
            if (!ok) toast.error('ลบแผนงานไม่สำเร็จ');
          }}
        />

        <SidebarSeparator />

        <NavStaticSection label="การจัดการ" items={ADMIN_NAV} activeHref={pathname} />
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <WorkspaceSwitcher
            userName={user.fullName}
            userRole={user.role}
            userImage={user.image}
            initials={initials(user.firstName, user.lastName)}
          />
        )}
      </SidebarFooter>

      <JoinGroupDialog
        open={joining}
        onOpenChange={setJoining}
        onJoined={() => {
          void refetch();
        }}
      />
    </Sidebar>
  );
}
