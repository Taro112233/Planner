// app/templates/page.tsx
'use client';

import React from 'react';
import { AuthedPlannerPage, PlannerPageSkeleton } from '@/components/PlannerShell';
import { TemplatesPage } from '@/components/TemplatesPage';

export default function Page() {
  return (
    <AuthedPlannerPage skeleton={<PlannerPageSkeleton cards={4} />}>
      <TemplatesPage />
    </AuthedPlannerPage>
  );
}
