// components/AdminPage/UserTable.tsx
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Phone } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import type { AdminUser } from '@/hooks/useAdminUsers';
import type { UserRole } from '@prisma/client';

interface UserTableProps {
  users: AdminUser[];
  actorRole: UserRole;
  currentUserId: string;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
  isUpdating: boolean;
}

export function UserTable({
  users,
  actorRole,
  currentUserId,
  onRoleChange,
  isUpdating,
}: UserTableProps) {
  const getInitials = (user: AdminUser) => {
    const f = user.firstName?.charAt(0) ?? '';
    const l = user.lastName?.charAt(0) ?? '';
    return (f + l).toUpperCase() || 'U';
  };

  if (users.length === 0) {
    return (
      <Card className="hidden md:block">
        <CardContent className="py-16 text-center text-content-secondary">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ไม่พบผู้ใช้งาน</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hidden md:block">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          รายชื่อผู้ใช้งาน
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">ผู้ใช้</TableHead>
              <TableHead>เบอร์โทร</TableHead>
              <TableHead>ตำแหน่ง</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-surface-interactive/50">
                {/* User info */}
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      {user.image && <AvatarImage src={user.image} alt={user.name} />}
                      <AvatarFallback className="gradient-brand-semantic text-white text-xs">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-1 text-xs text-content-secondary">(คุณ)</span>
                        )}
                      </p>
                      <p className="text-xs text-content-secondary truncate">{user.email}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Phone */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-content-secondary">
                    {user.phone ? (
                      <>
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{user.phone}</span>
                      </>
                    ) : (
                      <span className="text-content-tertiary text-xs italic">ไม่ระบุ</span>
                    )}
                  </div>
                </TableCell>

                {/* Position (inline role selector) */}
                <TableCell className="pr-6">
                  <RoleSelector
                    currentRole={user.role}
                    actorRole={actorRole}
                    targetUserId={user.id}
                    currentUserId={currentUserId}
                    onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
                    disabled={isUpdating}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}