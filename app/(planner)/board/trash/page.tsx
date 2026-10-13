// app/board/trash/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrashPage } from '@/components/TrashPage';
import { TrashPageSkeleton } from '@/components/TrashPage/TrashPageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function TrashPageRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) return <TrashPageSkeleton />;
  if (!user) return null;

  return <TrashPage />;
}
