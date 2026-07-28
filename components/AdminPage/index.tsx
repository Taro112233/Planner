// components/AdminPage/index.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSkeleton } from './AdminSkeleton';
import { UserTable } from './UserTable';
import { UserCardList } from './UserCardList';
import { PaginationBar } from './PaginationBar';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/auth-helpers';
import type { UserRole } from '@prisma/client';

export function AdminPage() {
  const { user: currentUser } = useCurrentUser();
  const {
    users,
    pagination,
    loading,
    error,
    setFetchParams,
    updateUserRole,
    isUpdating,
  } = useAdminUsers();

  const actorRole = normalizeRole(currentUser?.role);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`อัปเดตสิทธิ์สำเร็จ`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตสิทธิ์ไม่สำเร็จ');
    }
  };

  if (loading) return <AdminSkeleton />;

  if (error) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen"
    >
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-content-primary mb-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-interactive-primary" />
            Admin Panel
          </h1>
          <p className="text-content-secondary text-sm">
            จัดการผู้ใช้งานและสิทธิ์การเข้าถึง
          </p>
        </motion.div>

        {/* Table — md+ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <UserTable
            users={users}
            actorRole={actorRole}
            currentUserId={currentUser?.id ?? ''}
            onRoleChange={handleRoleChange}
            isUpdating={isUpdating}
          />
        </motion.div>

        {/* Card list — mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <UserCardList
            users={users}
            actorRole={actorRole}
            currentUserId={currentUser?.id ?? ''}
            onRoleChange={handleRoleChange}
            isUpdating={isUpdating}
          />
        </motion.div>

        {/* Pagination */}
        {pagination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <PaginationBar
              pagination={pagination}
              onPageChange={(page) => setFetchParams({ page })}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}