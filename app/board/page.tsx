// app/board/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BoardPage } from '@/components/BoardPage';
import { BoardSkeleton } from '@/components/BoardPage/BoardSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function BoardRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Skeleton only while the session is still unknown — a revalidation that
  // keeps the same user must not unmount BoardPage (and any open task panel).
  if (loading && !user) return <BoardSkeleton />;
  if (!user) return null;

  return <BoardPage />;
}
