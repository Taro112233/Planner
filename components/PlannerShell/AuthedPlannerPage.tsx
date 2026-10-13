// components/PlannerShell/AuthedPlannerPage.tsx
// The client-side auth gate every planner route repeats: redirect to /login
// without a session, show the page's skeleton while the session is unknown.
// Middleware already blocks signed-out requests; this covers a session that
// expires while the tab is open.
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AuthedPlannerPageProps {
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export function AuthedPlannerPage({ skeleton, children }: AuthedPlannerPageProps) {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading && !user) return <>{skeleton}</>;
  if (!user) return null;
  return <>{children}</>;
}
