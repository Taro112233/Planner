// components/MembersPage/MembersTable.tsx
// The roster. The role column is a select only where the viewer is allowed to
// change that member; everywhere else it is plain text.
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initials } from '@/components/TaskDetail';
import {
  WORKSPACE_ROLE_LABELS,
  canChangeMemberRole,
  type AssignableRole,
} from '@/lib/shared/member-roles';
import type { WorkspaceMemberDto } from '@/types/planner';
import type { MembersPayload } from './types';

const ASSIGNABLE: AssignableRole[] = ['ADMIN', 'MEMBER'];
const GRID = 'sm:grid sm:grid-cols-[minmax(0,1fr)_140px_90px_110px] sm:items-center sm:gap-3';

interface MembersTableProps {
  members: WorkspaceMemberDto[];
  viewer: MembersPayload['viewer'];
  onRoleChange: (member: WorkspaceMemberDto, role: AssignableRole) => void;
  /** Listing one group: show the group role, and leave workspace roles alone. */
  groupScoped?: boolean;
}

export function MembersTable({
  members,
  viewer,
  onRoleChange,
  groupScoped = false,
}: MembersTableProps) {
  return (
    <section aria-label="รายชื่อสมาชิก" className="wcard overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-[12.5px] font-semibold text-content-secondary">รายชื่อสมาชิก</h2>
      </div>
      <div
        className={`hidden bg-surface-secondary px-4 py-2 text-[11px] font-semibold text-content-tertiary ${GRID}`}
      >
        <span>สมาชิก</span>
        <span>สิทธิ์</span>
        <span className="text-right">งานค้าง</span>
        <span className="text-right">เข้าร่วมเมื่อ</span>
      </div>

      {members.map((member) => {
        const isSelf = member.organizationUserId === viewer.organizationUserId;
        // Offer only the roles this viewer may actually set.
        const options =
          isSelf || groupScoped
            ? []
            : ASSIGNABLE.filter(
                (role) =>
                  role === member.role || canChangeMemberRole(viewer.role, member.role, role)
              );
        const editable = options.length > 1;

        return (
          <div
            key={member.organizationUserId}
            className={`flex flex-col gap-2 border-t border-border-subtle px-4 py-2.5 text-[13px] first-of-type:border-t-0 ${GRID}`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Avatar className="size-[30px] shrink-0">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                <AvatarFallback className="text-[11px]">{initials(member.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate font-medium text-content-primary">
                  {member.name}
                  {isSelf && <span className="ml-1 text-[11px] text-content-tertiary">(คุณ)</span>}
                </span>
                <span className="block truncate text-[11px] text-content-tertiary">{member.email}</span>
              </span>
            </span>

            {editable ? (
              <Select
                value={member.role}
                onValueChange={(next) => onRoleChange(member, next as AssignableRole)}
              >
                <SelectTrigger className="h-8 text-xs" aria-label={`สิทธิ์ของ ${member.name}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((role) => (
                    <SelectItem key={role} value={role}>
                      {WORKSPACE_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-content-secondary">
                {WORKSPACE_ROLE_LABELS[member.role]}
                {groupScoped && member.groupRole === 'OWNER' && (
                  <span className="ml-1.5 rounded-full bg-surface-tertiary px-1.5 py-px text-[10.5px]">
                    เจ้าของกลุ่ม
                  </span>
                )}
              </span>
            )}

            <span className="text-xs tabular-nums text-content-tertiary sm:text-right">
              {member.openTaskCount} งาน
            </span>
            <span className="text-xs text-content-tertiary sm:text-right">
              {new Date(member.joinedAt).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </section>
  );
}
