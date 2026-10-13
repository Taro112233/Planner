// app/reports/page.tsx
'use client';

import React from 'react';
import { AuthedPlannerPage, PlannerPageSkeleton } from '@/components/PlannerShell';
import { ReportsPage } from '@/components/ReportsPage';

export default function Page() {
  return (
    <AuthedPlannerPage skeleton={<PlannerPageSkeleton cards={4} />}>
      <ReportsPage />
    </AuthedPlannerPage>
  );
}
