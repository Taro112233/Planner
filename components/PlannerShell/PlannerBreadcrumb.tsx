// components/PlannerShell/PlannerBreadcrumb.tsx
// Notion-style path in the topbar: the group you are in, then the plan inside
// it. Menus open on hover, not click, and the crumbs carry no chevron — in
// Notion the affordance is the hover itself, and a caret would suggest the
// text is a button you must click.
//
//   ◎ การตลาด Q3  /  ■ สปรินต์ 12
//
// Hovering a group in the first menu opens a submenu of its plans, so you can
// reach any board in two moves without touching the sidebar.
'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import type { PlanGroupDto, PlanSummaryDto } from '@/types/planner';

interface PlannerBreadcrumbProps {
  planGroups: PlanGroupDto[];
  plans: PlanSummaryDto[];
  /** The group currently in context, or null outside any group. */
  activeGroupId: string | null;
  /** The plan currently open, if the route is a board. */
  activePlanId?: string | null;
}

/**
 * Open on hover, close when the pointer leaves both trigger and menu.
 *
 * The delay matters: without it the menu closes in the gap between the crumb
 * and the panel below it, and the whole thing is unusable. The menus are also
 * non-modal — a modal one disables pointer events on the body while open,
 * which makes the trigger fire pointerleave and the menu flicker.
 */
function useHoverMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const onPointerEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const onPointerLeave = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }, [cancelClose]);

  return { open, setOpen, hoverProps: { onPointerEnter, onPointerLeave } };
}

const CRUMB_CLASS =
  'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm text-content-primary outline-none hover:bg-surface-secondary data-[state=open]:bg-surface-secondary';

export function PlannerBreadcrumb({
  planGroups,
  plans,
  activeGroupId,
  activePlanId = null,
}: PlannerBreadcrumbProps) {
  const router = useRouter();
  const groupMenu = useHoverMenu();
  const planMenu = useHoverMenu();

  const activeGroup = planGroups.find((group) => group.id === activeGroupId) ?? null;
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null;
  // The second crumb lists what lives in the current context: the group's
  // plans, or the ungrouped ones when no group is selected.
  const plansInContext = plans.filter((plan) => plan.planGroupId === activeGroupId);

  const plansOf = (planGroupId: string | null) =>
    plans.filter((plan) => plan.planGroupId === planGroupId);

  return (
    <nav aria-label="เส้นทาง" className="flex min-w-0 items-center gap-0.5">
      <DropdownMenu open={groupMenu.open} onOpenChange={groupMenu.setOpen} modal={false}>
        <DropdownMenuTrigger className={CRUMB_CLASS} {...groupMenu.hoverProps}>
          {activeGroup && (
            <span
              className="size-3 shrink-0 rounded-[4px]"
              style={{ backgroundColor: resolveGroupColor(activeGroup.color) }}
            />
          )}
          <span className="truncate font-medium">{activeGroup?.name ?? 'ส่วนตัว'}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={2}
          className="w-56"
          {...groupMenu.hoverProps}
        >
          <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
            พื้นที่ทำงาน
          </DropdownMenuLabel>

          {planGroups.map((group) => {
            const groupPlans = plansOf(group.id);
            const swatch = (
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: resolveGroupColor(group.color) }}
              />
            );

            // Only groups with plans get a submenu; an empty one would open a
            // panel with nothing to pick.
            if (groupPlans.length === 0) {
              return (
                <DropdownMenuItem key={group.id} onSelect={() => router.push(`/groups/${group.id}`)}>
                  {swatch}
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                  {group.id === activeGroupId && <Check size={13} />}
                </DropdownMenuItem>
              );
            }

            return (
              <DropdownMenuSub key={group.id}>
                <DropdownMenuSubTrigger onClick={() => router.push(`/groups/${group.id}`)}>
                  {swatch}
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                  {group.id === activeGroupId && <Check size={13} />}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                  <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
                    แผนงาน
                  </DropdownMenuLabel>
                  {groupPlans.map((plan) => (
                    <DropdownMenuItem key={plan.id} onSelect={() => router.push(`/plans/${plan.id}`)}>
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: resolveGroupColor(plan.color) }}
                      />
                      <span className="min-w-0 flex-1 truncate">{plan.name}</span>
                      {plan.id === activePlanId && <Check size={13} />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push(`/groups/${group.id}`)}>
                    ดูภาพรวมกลุ่ม
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}

          {planGroups.length === 0 && <DropdownMenuItem disabled>ยังไม่มีกลุ่ม</DropdownMenuItem>}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
            ส่วนตัว
          </DropdownMenuLabel>
          {plansOf(null).map((plan) => (
            <DropdownMenuItem key={plan.id} onSelect={() => router.push(`/plans/${plan.id}`)}>
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: resolveGroupColor(plan.color) }}
              />
              <span className="min-w-0 flex-1 truncate">{plan.name}</span>
              {plan.id === activePlanId && <Check size={13} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChevronRight size={13} className="shrink-0 text-content-tertiary" aria-hidden="true" />

      <DropdownMenu open={planMenu.open} onOpenChange={planMenu.setOpen} modal={false}>
        <DropdownMenuTrigger className={CRUMB_CLASS} {...planMenu.hoverProps}>
          {activePlan && (
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: resolveGroupColor(activePlan.color) }}
            />
          )}
          <span className="truncate font-medium">{activePlan?.name ?? 'เลือกแผนงาน'}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={2} className="w-56" {...planMenu.hoverProps}>
          <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
            {activeGroup ? `แผนงานใน ${activeGroup.name}` : 'แผนงานส่วนตัว'}
          </DropdownMenuLabel>

          {plansInContext.map((plan) => (
            <DropdownMenuItem key={plan.id} onSelect={() => router.push(`/plans/${plan.id}`)}>
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: resolveGroupColor(plan.color) }}
              />
              <span className="min-w-0 flex-1 truncate">{plan.name}</span>
              <span className="text-[10px] text-content-tertiary tabular-nums">
                {plan.taskCount}
              </span>
              {plan.id === activePlanId && <Check size={13} />}
            </DropdownMenuItem>
          ))}

          {plansInContext.length === 0 && (
            <DropdownMenuItem disabled>ยังไม่มีแผนงานในนี้</DropdownMenuItem>
          )}

          {activeGroup && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(`/groups/${activeGroup.id}`)}>
                ดูภาพรวมกลุ่ม
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
