// components/PlannerShell/PlannerSidebar.tsx
// Left nav, following the mockup's structure (Planner v2.dc.html): a search
// box, the main destinations, "กลุ่มของฉัน", "แผนงาน", "การจัดการ", and the
// user chip in the footer (account menu: workspaces, settings, sign-out).
'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FolderPlus, Plus, UserPlus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupAction,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlanNav } from '@/hooks/usePlanNav';
import { useInboxUnread } from '@/hooks/useInboxUnread';
import { invalidateApiResource } from '@/hooks/useApiResource';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { NavStaticSection, type StaticNavItem } from './NavStaticSection';
import { PlanNavSection, planGroupToNavItem, planToNavItem } from './PlanNavSection';
import { JoinGroupDialog } from './JoinGroupDialog';
import { SidebarSearchRow } from './SidebarSearchRow';
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
  // Not a page: it leaves the group in scope (see usePlannerScope).
  { key: 'workspace', label: 'Workspace ของฉัน', icon: '◉', color: 'var(--color-group-teal)' },
  {
    key: 'inbox',
    label: 'การแจ้งเตือน',
    icon: '✉',
    color: 'var(--color-group-pink)',
    href: '/inbox',
  },
];

const ADMIN_NAV: StaticNavItem[] = [
  { key: 'reports', label: 'รายงาน', icon: '▤', color: 'var(--color-group-teal)', href: '/reports' },
  {
    key: 'audit',
    label: 'ประวัติตรวจสอบ',
    icon: '◔',
    color: 'var(--color-group-purple)',
    href: '/audit',
  },
  {
    key: 'members',
    label: 'สมาชิก & สิทธิ์',
    icon: '⚿',
    color: 'var(--color-group-slate)',
    href: '/members',
  },
  {
    key: 'templates',
    label: 'เทมเพลต',
    icon: '⌗',
    color: 'var(--color-group-green)',
    href: '/templates',
  },
  {
    key: 'trash',
    label: 'ถังขยะ',
    icon: '🗑',
    color: 'var(--color-group-slate)',
    href: '/board/trash',
  },
];

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
  const inboxUnread = useInboxUnread();

  const router = useRouter();
  // The group being worked in survives moving to other pages (see
  // usePlannerScope); null is "Workspace ของฉัน".
  const { scopeGroupId: activeGroupId, scopeGroup: activeGroup, setScopeGroupId } =
    usePlannerScope();

  const enterPersonalWorkspace = () => {
    setScopeGroupId(null);
    // A page that belongs to a group would put the scope straight back.
    const onGroupPage =
      pathname.startsWith('/groups/') ||
      (pathname.startsWith('/plans/') &&
        plans.some((plan) => pathname === `/plans/${plan.id}` && plan.planGroupId));
    if (onGroupPage) router.push('/home');
  };
  // Inside a group you see that group's plans; outside it, the ones that
  // belong to no group at all.
  const visiblePlans = plans.filter((plan) => plan.planGroupId === activeGroupId);

  return (
    // AppHeader is hidden on planner routes (components/shared/AppHeader.tsx),
    // so the rail uses the primitive's default full-height fixed positioning.
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-1">
        <SidebarSearchRow />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <NavStaticSection
          items={MAIN_NAV.map((item) => {
            if (item.key === 'inbox') return { ...item, badge: inboxUnread, badgeAccent: true };
            if (item.key === 'workspace') {
              return { ...item, active: activeGroupId === null, onSelect: enterPersonalWorkspace };
            }
            return item;
          })}
          activeHref={pathname}
        />

        <PlanNavSection
          label="กลุ่มของฉัน"
          addLabel="สร้างกลุ่มใหม่"
          addPlaceholder="ชื่อกลุ่ม แล้วกด Enter"
          variant="chip"
          items={planGroups.map(planGroupToNavItem)}
          // Highlight the group in scope, on whatever page you are.
          activeHref={activeGroupId ? `/groups/${activeGroupId}` : ''}
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
          renderAddMenu={(openNameField) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarGroupAction title="เพิ่มกลุ่ม">
                  <Plus />
                  <span className="sr-only">เพิ่มกลุ่ม</span>
                </SidebarGroupAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="right"
                className="w-48"
                // Radix hands focus back to the "+" trigger on close, which
                // blurs the just-opened name field and its onBlur closes it
                // again — so "สร้างกลุ่มใหม่" appeared to do nothing.
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <DropdownMenuItem onSelect={() => setTimeout(openNameField, 0)}>
                  <FolderPlus size={13} />
                  สร้างกลุ่มใหม่
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTimeout(() => setJoining(true), 0)}>
                  <UserPlus size={13} />
                  เข้าร่วมกลุ่ม
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />

        <PlanNavSection
          label={activeGroup ? `แผนงานใน ${activeGroup.name}` : 'แผนงานส่วนตัว'}
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
          // Joining switches into the group's workspace: nothing cached for
          // the old one applies any more.
          invalidateApiResource();
          void refetch();
        }}
      />
    </Sidebar>
  );
}
