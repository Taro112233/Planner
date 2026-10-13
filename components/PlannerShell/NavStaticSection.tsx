// components/PlannerShell/NavStaticSection.tsx
// The mockup's fixed nav sections (top group and "การจัดการ"). A row is a
// link (href), an action (onSelect — e.g. "Workspace ของฉัน", which changes
// scope rather than page), or, with neither, a disabled placeholder.
'use client';

import React from 'react';
import Link from 'next/link';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavIconChip } from './NavIconChip';

export interface StaticNavItem {
  key: string;
  label: string;
  /** Single glyph, matching the mockup's ⌂ ✓ ✉ ▤ ◔ ⚿ ⌗ 🗑. */
  icon: string;
  color: string;
  href?: string;
  /** An action instead of a link. */
  onSelect?: () => void;
  /** Overrides the href match, for action rows. */
  active?: boolean;
  badge?: number;
  /** Highlight the badge (the mockup does this for unread notifications). */
  badgeAccent?: boolean;
}

interface NavStaticSectionProps {
  label?: string;
  items: StaticNavItem[];
  activeHref: string;
}

export function NavStaticSection({ label, items, activeHref }: NavStaticSectionProps) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const content = (
              <>
                <NavIconChip color={item.color}>{item.icon}</NavIconChip>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </>
            );

            return (
              <SidebarMenuItem key={item.key}>
                {item.href ? (
                  <SidebarMenuButton
                    asChild
                    isActive={item.active ?? activeHref === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>{content}</Link>
                  </SidebarMenuButton>
                ) : item.onSelect ? (
                  <SidebarMenuButton
                    isActive={item.active}
                    tooltip={item.label}
                    onClick={item.onSelect}
                  >
                    {content}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    disabled
                    tooltip={`${item.label} — เร็ว ๆ นี้`}
                    className="cursor-not-allowed opacity-50"
                  >
                    {content}
                  </SidebarMenuButton>
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <SidebarMenuBadge
                    className={
                      item.badgeAccent
                        ? 'bg-surface-danger text-content-inverse'
                        : undefined
                    }
                  >
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
