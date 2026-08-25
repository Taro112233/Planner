// components/PlannerShell/PlannerTopbar.tsx
// Per-page header row inside the planner shell: sidebar toggle, title +
// subtitle, a team-avatar stack, and an optional right-aligned action
// (e.g. the "+ New task" button).
'use client';

import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase() || 'U';
}

interface PlannerTopbarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PlannerTopbar({ title, subtitle, action }: PlannerTopbarProps) {
  const { members } = useOrganizationMembers();

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
      <SidebarTrigger className="-ml-1 shrink-0" />

      <div className="min-w-0">
        <h1 className="text-xl font-bold text-content-primary truncate">{title}</h1>
        {subtitle && <p className="text-xs text-content-tertiary mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex-1" />

      {members.length > 0 && (
        <div className="hidden sm:flex items-center -space-x-2 shrink-0">
          {members.slice(0, 5).map((member) => (
            <Avatar key={member.organizationUserId} size="sm" className="ring-2 ring-surface-primary">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}

      {action}
    </div>
  );
}
