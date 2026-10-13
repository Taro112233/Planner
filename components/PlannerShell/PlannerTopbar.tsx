// components/PlannerShell/PlannerTopbar.tsx
// Per-page header inside the planner shell, as in the mockup: a large title
// with its subtitle underneath, a team-avatar stack, and an optional
// right-aligned action. A breadcrumb, when given, sits above the title.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { resolveGroupColor } from '@/lib/shared/group-colors';

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
  /** Show which group the page's data belongs to (see usePlannerScope). */
  showScope?: boolean;
}

export function PlannerTopbar({
  title,
  subtitle,
  action,
  breadcrumb,
  showScope = false,
}: PlannerTopbarProps) {
  const { members } = useOrganizationMembers();
  const { scopeGroup } = usePlannerScope();

  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-3.5">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-0.5 min-w-0">{breadcrumb}</div>}
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-xl font-bold tracking-tight text-content-primary">{title}</h1>
          {showScope && (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-tertiary px-2.5 py-0.5 text-[11.5px] text-content-secondary"
              title="เปลี่ยนได้จากแถบข้าง: เลือกกลุ่ม หรือ Workspace ของฉัน"
            >
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: scopeGroup
                    ? resolveGroupColor(scopeGroup.color)
                    : 'var(--color-group-teal)',
                }}
              />
              {scopeGroup ? `กลุ่ม ${scopeGroup.name}` : 'ทั้งเวิร์กสเปซ'}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-px truncate text-xs text-content-tertiary">{subtitle}</p>}
      </div>

      <div className="flex-1" />

      {members.length > 0 && (
        <div className="hidden shrink-0 items-center -space-x-1.5 sm:flex">
          {members.slice(0, 5).map((member) => (
            <Avatar
              key={member.organizationUserId}
              size="sm"
              className="size-[26px] ring-[1.5px] ring-surface-canvas"
              title={member.name}
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
