// app/profile/page.tsx
'use client';

import React, { useEffect } from 'react';
import { ProfilePage } from '@/components/ProfilePage';
import { ProfileSkeleton } from '@/components/ProfilePage/ProfileSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const { loading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // ✅ Show skeleton while checking auth
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ProfilePage />;
}