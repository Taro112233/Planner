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
    <ul>
      {members.map((member) => (
        <li key={member.organizationUserId} className="flex items-center gap-[11px] border-t border-border-subtle px-1 py-[9px] text-[13.5px]">
          <Avatar className="size-[30px] shrink-0">
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
