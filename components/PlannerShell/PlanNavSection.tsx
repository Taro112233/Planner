// components/PlannerShell/PlanNavSection.tsx
// The sidebar's "กลุ่มของฉัน" and "แผนงาน" sections: a labelled list with a
// count badge per row, an inline "add" form, and (for plans) a menu that moves
// the plan into a group.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, MoreHorizontal, FolderInput, Trash2 } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { NavIconChip } from './NavIconChip';
import type { PlanGroupDto, PlanSummaryDto } from '@/types/planner';

interface PlanNavSectionProps {
  label: string;
  addLabel: string;
  addPlaceholder: string;
  items: NavItem[];
  activeHref: string;
  onAdd: (name: string) => Promise<unknown>;
  /** Plans only — the groups a plan can be moved into. */
  moveTargets?: PlanGroupDto[];
  onMoveToGroup?: (itemId: string, planGroupId: string | null) => void;
  onDelete?: (itemId: string) => void;
  /**
   * 'chip' draws the mockup's 22px ◎ tile (groups); 'square' the small colour
   * square (plans).
   */
  variant?: 'chip' | 'square';
  /** Rendered under the list — e.g. the "join with a code" action. */
  footer?: React.ReactNode;
}

export interface NavItem {
  id: string;
  name: string;
  href: string;
  color: string | null;
  badge: number;
  /** The group this plan currently sits in, if any. */
  planGroupId?: string | null;
}

/** Shapes a plan for the nav without leaking DTO details into the component. */
export function planToNavItem(plan: PlanSummaryDto): NavItem {
  return {
    id: plan.id,
    name: plan.name,
    href: `/plans/${plan.id}`,
    color: plan.color,
    badge: plan.taskCount,
    planGroupId: plan.planGroupId,
  };
}

export function planGroupToNavItem(planGroup: PlanGroupDto): NavItem {
  return {
    id: planGroup.id,
    name: planGroup.name,
    href: `/groups/${planGroup.id}`,
    color: planGroup.color,
    badge: planGroup.planCount,
  };
}

export function PlanNavSection({
  label,
  addLabel,
  addPlaceholder,
  items,
  activeHref,
  onAdd,
  moveTargets,
  onMoveToGroup,
  onDelete,
  variant = 'square',
  footer,
}: PlanNavSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(name);
      setDraft('');
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupAction title={addLabel} onClick={() => setAdding((open) => !open)}>
        <Plus />
        <span className="sr-only">{addLabel}</span>
      </SidebarGroupAction>

      <SidebarGroupContent>
        {adding && (
          <form onSubmit={handleSubmit} className="px-2 pb-2">
            <Input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setDraft('');
                  setAdding(false);
                }
              }}
              placeholder={addPlaceholder}
              disabled={submitting}
              className="h-7 text-xs"
            />
          </form>
        )}

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild isActive={activeHref === item.href} tooltip={item.name}>
                <Link href={item.href}>
                  {variant === 'chip' ? (
                    <NavIconChip color={resolveGroupColor(item.color)}>◎</NavIconChip>
                  ) : (
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: resolveGroupColor(item.color) }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </Link>
              </SidebarMenuButton>

              {(onMoveToGroup || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="absolute right-1 top-1 z-10 rounded p-1 text-content-tertiary opacity-0 transition-opacity hover:bg-surface-interactive hover:text-content-primary focus-visible:opacity-100 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden"
                      aria-label={`ตัวเลือกของ ${item.name}`}
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-52">
                    {onMoveToGroup && moveTargets && (
                      <>
                        <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-normal text-content-tertiary">
                          <FolderInput size={12} />
                          ย้ายเข้ากลุ่ม
                        </DropdownMenuLabel>
                        {moveTargets.length === 0 && (
                          <DropdownMenuItem disabled>ยังไม่มีกลุ่ม</DropdownMenuItem>
                        )}
                        {moveTargets.map((target) => (
                          <DropdownMenuItem
                            key={target.id}
                            disabled={item.planGroupId === target.id}
                            onSelect={() => onMoveToGroup(item.id, target.id)}
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: resolveGroupColor(target.color) }}
                            />
                            {target.name}
                          </DropdownMenuItem>
                        ))}
                        {item.planGroupId && (
                          <DropdownMenuItem onSelect={() => onMoveToGroup(item.id, null)}>
                            เอาออกจากกลุ่ม
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item.id)}>
                          <Trash2 size={13} />
                          ลบ
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))}

          {items.length === 0 && !adding && (
            <p className="px-2 py-1 text-[11px] text-content-tertiary group-data-[collapsible=icon]:hidden">
              ยังไม่มีรายการ
            </p>
          )}
        </SidebarMenu>

        {footer}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
