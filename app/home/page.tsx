// app/home/page.tsx
// "หน้าแรก" — the cross-plan overview.
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomePage } from '@/components/HomePage';
import { HomePageSkeleton } from '@/components/HomePage/HomePageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function HomeRoute() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  if (loading && !user) return <HomePageSkeleton />;
  if (!user) return null;

  return <HomePage />;
}
