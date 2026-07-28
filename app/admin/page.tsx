// app/admin/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPage } from '@/components/AdminPage';
import { AdminSkeleton } from '@/components/AdminPage/AdminSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { hasAdminAccess, normalizeRole } from '@/lib/auth-helpers';

export default function AdminRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const role = normalizeRole(user.role);
    if (!hasAdminAccess(role)) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) return <AdminSkeleton />;
  if (!user || !hasAdminAccess(normalizeRole(user.role))) return null;

  return <AdminPage />;
}