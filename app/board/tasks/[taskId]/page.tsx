// app/board/tasks/[taskId]/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskPage } from '@/components/TaskPage';
import { TaskPageSkeleton } from '@/components/TaskPage/TaskPageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function TaskPageRoute() {
  const router = useRouter();
  const { taskId } = useParams<{ taskId: string }>();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) return <TaskPageSkeleton />;
  if (!user) return null;

  return <TaskPage taskId={taskId} />;
}
