// app/inbox/page.tsx
'use client';

import React from 'react';
import { AuthedPlannerPage, PlannerPageSkeleton } from '@/components/PlannerShell';
import { InboxPage } from '@/components/InboxPage';

export default function Page() {
  return (
    <AuthedPlannerPage skeleton={<PlannerPageSkeleton cards={1} />}>
      <InboxPage />
    </AuthedPlannerPage>
  );
}
