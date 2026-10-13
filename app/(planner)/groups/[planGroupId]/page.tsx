// app/groups/[planGroupId]/page.tsx
// Overview of one group: its plans, the member roster, and recent activity.
'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlanGroupPage } from '@/components/PlanGroupPage';
import { PlanGroupPageSkeleton } from '@/components/PlanGroupPage/PlanGroupPageSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function PlanGroupRoute() {
  const router = useRouter();
  const params = useParams<{ planGroupId: string }>();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  if (loading && !user) return <PlanGroupPageSkeleton />;
  if (!user) return null;

  return <PlanGroupPage planGroupId={params.planGroupId} />;
}
