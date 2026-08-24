// components/PlannerShell/NavStaticSection.tsx
// The mockup's fixed nav sections (top group and "การจัดการ"). Destinations
// that have no page yet render as disabled rows rather than dead links — the
// same choice the search box already makes — so the rail matches the mockup's
// shape without shipping 404s.
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
                <span className="truncate">{item.label}</span>
              </>
            );

            return (
              <SidebarMenuItem key={item.key}>
                {item.href ? (
                  <SidebarMenuButton
                    asChild
                    isActive={activeHref === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>{content}</Link>
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
