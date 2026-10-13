// app/audit/page.tsx
// "ประวัติตรวจสอบ" — the workspace audit log.
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuditLogPage, AuditLogPageSkeleton } from '@/components/AuditLogPage';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function AuditRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  if (loading && !user) return <AuditLogPageSkeleton />;
  if (!user) return null;

  return <AuditLogPage />;
}
