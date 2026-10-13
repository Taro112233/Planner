// app/members/page.tsx
'use client';

import React from 'react';
import { AuthedPlannerPage, PlannerPageSkeleton } from '@/components/PlannerShell';
import { MembersPage } from '@/components/MembersPage';

export default function Page() {
  return (
    <AuthedPlannerPage skeleton={<PlannerPageSkeleton cards={3} />}>
      <MembersPage />
    </AuthedPlannerPage>
  );
}
