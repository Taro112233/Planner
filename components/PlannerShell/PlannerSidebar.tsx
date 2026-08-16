// components/PlannerShell/PlannerSidebar.tsx
// Left nav for the planner app shell. "Board" and "Trash" are wired up today
// — later phases (Home, My Tasks, Inbox, workspace Groups, multiple Plans,
// Reports, Audit log, Members, Templates) will add their own nav sections
// here once those pages exist. No dead links are rendered in the meantime.
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Search, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
}

export function PlannerSidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  return (
    // AppHeader is hidden on /board routes (see components/shared/AppHeader.tsx),
    // so the rail uses the primitive's default full-height fixed positioning.
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="relative px-1 py-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-content-tertiary pointer-events-none" />
          <SidebarInput placeholder="Search tasks…" className="pl-8" disabled />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/board') && !pathname.startsWith('/board/trash')}
                  tooltip="Board"
                >
                  <Link href="/board">
                    <LayoutGrid />
                    <span>Board</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/board/trash')} tooltip="Trash">
                  <Link href="/board/trash">
                    <Trash2 />
                    <span>Trash</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} alt={user.fullName} />}
              <AvatarFallback className="text-[10px]">
                {initials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-medium text-content-primary truncate">{user.fullName}</p>
              <p className="text-[10px] text-content-tertiary truncate">{user.role}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
