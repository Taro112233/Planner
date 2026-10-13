// components/AuditLogPage/AuditLogFilters.tsx
// Category chips, a row of member avatars (click to filter by that person,
// click again to clear), and the CSV export link.
'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail/subtaskAttribution';
import { cn } from '@/lib/client/utils';
import type { AuditCategory, OrganizationMemberDto } from '@/types/planner';
import { AUDIT_CATEGORIES } from '@/lib/shared/activity-labels';

interface AuditLogFiltersProps {
  category: AuditCategory;
  actorId: string | null;
  members: OrganizationMemberDto[];
  exportHref: string;
  onCategoryChange: (category: AuditCategory) => void;
  onActorChange: (actorId: string | null) => void;
}

export function AuditLogFilters({
  category,
  actorId,
  members,
  exportHref,
  onCategoryChange,
  onActorChange,
}: AuditLogFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AUDIT_CATEGORIES.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onCategoryChange(chip.key)}
          aria-pressed={category === chip.key}
          className={cn(
            'rounded-full border px-3 py-1 text-xs transition-colors',
            category === chip.key
              ? 'border-transparent bg-interactive-primary text-primary-foreground'
              : 'border-border-subtle bg-surface-secondary text-content-secondary hover:text-content-primary'
          )}
        >
          {chip.label}
        </button>
      ))}

      {members.length > 0 && <span className="mx-1 h-5 w-px bg-border-subtle" aria-hidden="true" />}

      <div className="flex flex-wrap items-center gap-1.5">
        {members.map((member) => {
          const active = actorId === member.organizationUserId;
          return (
            <button
              key={member.organizationUserId}
              type="button"
              title={member.name}
              aria-label={`กรองตาม ${member.name}`}
              aria-pressed={active}
              onClick={() => onActorChange(active ? null : member.organizationUserId)}
              className={cn(
                'rounded-full ring-offset-2 ring-offset-surface-primary transition-shadow',
                active ? 'ring-2 ring-interactive-primary' : 'ring-1 ring-border-subtle'
              )}
            >
              <Avatar className="h-6 w-6">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
              </Avatar>
            </button>
          );
        })}
      </div>

      <a
        href={exportHref}
        className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-secondary px-3 py-1 text-xs text-content-secondary hover:text-content-primary"
      >
        <Download size={13} />
        ส่งออก CSV
      </a>
    </div>
  );
}
