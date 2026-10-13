// components/MembersPage/MembersRoleCards.tsx
// The mockup's row of access-group cards: one per workspace role, with an
// avatar stack and a head count.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/components/TaskDetail';
import { WORKSPACE_ROLE_LABELS, type WorkspaceRole } from '@/lib/shared/member-roles';
import type { WorkspaceMemberDto } from '@/types/planner';

const ROLE_CARDS: { role: WorkspaceRole; color: string; description: string }[] = [
  {
    role: 'OWNER',
    color: 'var(--color-group-purple)',
    description: 'เจ้าของเวิร์กสเปซ ทำได้ทุกอย่าง รวมถึงลดสิทธิ์ผู้ดูแล',
  },
  {
    role: 'ADMIN',
    color: 'var(--color-group-blue)',
    description: 'ดูประวัติตรวจสอบ และแต่งตั้งสมาชิกเป็นผู้ดูแล',
  },
  {
    role: 'MEMBER',
    color: 'var(--color-group-green)',
    description: 'สร้าง แก้ไข และติ๊กงานในทุกแผนงานของเวิร์กสเปซ',
  },
];

export function MembersRoleCards({ members }: { members: WorkspaceMemberDto[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ROLE_CARDS.map((card) => {
        const holders = members.filter((member) => member.role === card.role);
        return (
          <div key={card.role} className="wcard px-[13px] py-3">
            <div className="flex items-center gap-[7px]">
              <span className="size-[9px] rounded-full" style={{ backgroundColor: card.color }} />
              <span className="text-[13.5px] font-semibold text-content-primary">
                {WORKSPACE_ROLE_LABELS[card.role]}
              </span>
            </div>
            <p className="mb-2.5 mt-1.5 min-h-8 text-[11px] leading-relaxed text-content-tertiary">
              {card.description}
            </p>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {holders.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.organizationUserId}
                    className="size-6 ring-[1.5px] ring-surface-card"
                    title={member.name}
                  >
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                    <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="flex-1" />
              <span className="text-[11px] text-content-tertiary">{holders.length} คน</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
