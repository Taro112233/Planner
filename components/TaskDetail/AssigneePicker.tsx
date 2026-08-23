// components/TaskDetail/AssigneePicker.tsx
// Avatar-toggle assignee picker over the caller's organization members.
// Shared by TaskDetailModal (slide-over) and TaskPage (full page).
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from './subtaskAttribution';
import type { OrganizationMemberDto, TaskAssigneeDto } from '@/types/planner';

interface AssigneePickerProps {
  members: OrganizationMemberDto[];
  assignees: TaskAssigneeDto[];
  onToggle: (organizationUserId: string, isAssigned: boolean) => void;
  disabled?: boolean;
}

export function AssigneePicker({ members, assignees, onToggle, disabled = false }: AssigneePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => {
        const assigned = assignees.some((a) => a.organizationUserId === member.organizationUserId);
        return (
          <button
            key={member.organizationUserId}
            type="button"
            onClick={() => onToggle(member.organizationUserId, assigned)}
            disabled={disabled}
            title={member.name}
            className={[
              'rounded-full transition-all',
              assigned ? 'ring-2 ring-interactive-primary' : 'ring-1 ring-border-subtle opacity-50 hover:opacity-100',
              disabled && 'cursor-not-allowed',
            ].join(' ')}
          >
            <Avatar size="sm">
              {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
              <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
            </Avatar>
          </button>
        );
      })}
      {members.length === 0 && <p className="text-xs text-content-tertiary">No members yet.</p>}
    </div>
  );
}
