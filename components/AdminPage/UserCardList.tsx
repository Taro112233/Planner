// components/AdminPage/UserCardList.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Users } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import type { AdminUser } from '@/hooks/useAdminUsers';
import type { UserRole } from '@prisma/client';

interface UserCardListProps {
  users: AdminUser[];
  actorRole: UserRole;
  currentUserId: string;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
  isUpdating: boolean;
}

export function UserCardList({
  users,
  actorRole,
  currentUserId,
  onRoleChange,
  isUpdating,
}: UserCardListProps) {
  const getInitials = (user: AdminUser) => {
    const f = user.firstName?.charAt(0) ?? '';
    const l = user.lastName?.charAt(0) ?? '';
    return (f + l).toUpperCase() || 'U';
  };

  if (users.length === 0) {
    return (
      <div className="md:hidden py-16 text-center text-content-secondary">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>ไม่พบผู้ใช้งาน</p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.04 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              {/* Top row: avatar + name/email */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {user.image && <AvatarImage src={user.image} alt={user.name} />}
                  <AvatarFallback className="gradient-brand-semantic text-white text-sm">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-content-primary truncate">
                      {user.name}
                    </p>
                    {user.id === currentUserId && (
                      <span className="text-xs text-content-secondary shrink-0">(คุณ)</span>
                    )}
                  </div>
                  <p className="text-xs text-content-secondary truncate">{user.email}</p>

                  {/* Phone */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-content-tertiary shrink-0" />
                    {user.phone ? (
                      <span className="text-xs text-content-secondary">{user.phone}</span>
                    ) : (
                      <span className="text-xs text-content-tertiary italic">ไม่ระบุ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom row: label + inline role selector */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-primary">
                <span className="text-xs text-content-secondary">ตำแหน่ง</span>
                <RoleSelector
                  currentRole={user.role}
                  actorRole={actorRole}
                  targetUserId={user.id}
                  currentUserId={currentUserId}
                  onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}