// components/PlannerShell/PlannerTopbar.tsx
// Per-page header row inside the planner shell: the breadcrumb (or a title), a
// team-avatar stack, and an optional right-aligned action.
//
// Deliberately compact, like Notion's: the collapse control lives with the
// sidebar it collapses, not here.
'use client';

import React from 'react';
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
  /** Replaces the title with a path (see PlannerBreadcrumb). */
  breadcrumb?: React.ReactNode;
}

export function PlannerTopbar({ title, subtitle, action, breadcrumb }: PlannerTopbarProps) {
  const { members } = useOrganizationMembers();

  return (
    <div className="flex h-11 items-center gap-3 border-b border-border-subtle px-3">
      <div className="flex min-w-0 items-baseline gap-2">
        {breadcrumb ?? (
          <h1 className="truncate text-sm font-semibold text-content-primary">{title}</h1>
        )}
        {subtitle && (
          <p className="hidden truncate text-[11px] text-content-tertiary lg:block">{subtitle}</p>
        )}
      </div>

      <div className="flex-1" />

      {members.length > 0 && (
        <div className="hidden sm:flex items-center -space-x-2 shrink-0">
          {members.slice(0, 5).map((member) => (
            <Avatar
              key={member.organizationUserId}
              size="sm"
              className="size-6 ring-2 ring-surface-primary"
            >
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
