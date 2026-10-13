// app/settings/page.tsx
'use client';

import React from 'react';
import { AuthedPlannerPage, PlannerPageSkeleton } from '@/components/PlannerShell';
import { SettingsPage } from '@/components/SettingsPage';

export default function Page() {
  return (
    <AuthedPlannerPage skeleton={<PlannerPageSkeleton cards={2} />}>
      <SettingsPage />
    </AuthedPlannerPage>
  );
}
