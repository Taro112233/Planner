// components/PlanGroupPage/PlanGroupMemberList.tsx
// Workspace members with how much open work each is carrying across the
// group's plans. Per-group membership is not modeled yet (Instruction-group.md
// §7), so this lists every active member of the organization.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail';
import type { PlanGroupMemberDto } from '@/types/planner';

interface PlanGroupMemberListProps {
  members: PlanGroupMemberDto[];
}

export function PlanGroupMemberList({ members }: PlanGroupMemberListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-content-tertiary">ยังไม่มีสมาชิก</p>;
  }

  return (
    <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-secondary">
      {members.map((member) => (
        <li key={member.organizationUserId} className="flex items-center gap-3 px-4 py-2.5">
          <Avatar className="size-7 shrink-0">
            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
            <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-content-primary">{member.name}</p>
            <p className="text-[11px] text-content-tertiary">{member.role}</p>
          </div>
          <span className="shrink-0 text-xs text-content-tertiary tabular-nums">
            {member.openTaskCount} งานค้าง
          </span>
        </li>
      ))}
    </ul>
  );
}
