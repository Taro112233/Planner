// app/my-tasks/page.tsx
// "งานของฉัน" — every unfinished card assigned to the caller.
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MyTasksPage } from '@/components/MyTasksPage';
import { MyTasksPageSkeleton } from '@/components/MyTasksPage/MyTasksPageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function MyTasksRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  if (loading && !user) return <MyTasksPageSkeleton />;
  if (!user) return null;

  return <MyTasksPage />;
}
