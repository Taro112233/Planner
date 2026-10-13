// app/plans/[planId]/page.tsx
// One plan's board. /board renders the same component against the
// organization's default plan.
'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BoardPage } from '@/components/BoardPage';
import { BoardSkeleton } from '@/components/BoardPage/BoardSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlanNav } from '@/hooks/usePlanNav';

export default function PlanBoardRoute() {
  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const { user, loading } = useCurrentUser();
  const { plans } = usePlanNav();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  // Skeleton only while the session is still unknown — a revalidation that
  // keeps the same user must not unmount BoardPage (and any open task panel).
  if (loading && !user) return <BoardSkeleton />;
  if (!user) return null;

  const plan = plans.find((candidate) => candidate.id === params.planId);

  return <BoardPage planId={params.planId} planName={plan?.name} />;
}
