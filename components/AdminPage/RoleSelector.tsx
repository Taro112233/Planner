// components/AdminPage/RoleSelector.tsx
'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getRoleHierarchy, getRoleBadgeClasses } from '@/lib/auth-helpers';
import { cn } from '@/lib/utils';
import type { UserRole } from '@prisma/client';

const ALL_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPERADMIN'];

const ROLE_LABELS: Record<UserRole, string> = {
  USER: '👤 User',
  ADMIN: '🛡️ Admin',
  SUPERADMIN: '👑 Super Admin',
};

interface RoleSelectorProps {
  currentRole: UserRole;   // target user's current role
  actorRole: UserRole;     // logged-in admin's role
  targetUserId: string;
  currentUserId: string;
  onRoleChange: (newRole: UserRole) => Promise<void>;
  disabled?: boolean;
}

export function RoleSelector({
  currentRole,
  actorRole,
  targetUserId,
  currentUserId,
  onRoleChange,
  disabled,
}: RoleSelectorProps) {
  const isSelf = targetUserId === currentUserId;

  // ─── ตรวจว่าแก้ไขได้ไหม ───
  // กรณี self: แก้ได้เสมอ (แต่ assign ได้แค่ ≤ ตัวเอง)
  // กรณีคนอื่น: target hierarchy ต้องต่ำกว่า actor
  const canEdit =
    isSelf || getRoleHierarchy(actorRole) > getRoleHierarchy(currentRole);

  // ─── Read-only badge ───
  if (!canEdit) {
    return (
      <Badge
        variant="outline"
        className={cn('text-xs pointer-events-none', getRoleBadgeClasses(currentRole))}
      >
        {ROLE_LABELS[currentRole]}
      </Badge>
    );
  }

  // ─── Assignable roles ───
  // ทั้ง self และ others: assign ได้แค่ role ≤ actorRole
  const assignable = ALL_ROLES.filter(
    (r) => getRoleHierarchy(r) <= getRoleHierarchy(actorRole)
  );

  const handleChange = async (value: string) => {
    if (value === currentRole) return;
    await onRoleChange(value as UserRole);
  };

  return (
    <Select value={currentRole} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'w-36 h-8 text-xs',
          // highlight กรณีเป็นแถวตัวเอง
          isSelf && 'border-interactive-primary/50'
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assignable.map((role) => (
          <SelectItem key={role} value={role} className="text-xs">
            {ROLE_LABELS[role]}
            {role === currentRole && isSelf && (
              <span className="ml-1.5 text-content-tertiary">(ปัจจุบัน)</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}