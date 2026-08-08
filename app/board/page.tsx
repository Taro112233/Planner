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

  if (loading) return <BoardSkeleton />;
  if (!user) return null;

  return <BoardPage />;
}
