// components/PlannerShell/PlannerShell.tsx
// App shell for planner routes: a collapsible left sidebar plus an inset
// content area. Signed-in pages have no other chrome: the top navbar belongs
// to the landing page alone (app/page.tsx).
'use client';

import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { PlanNavProvider } from '@/hooks/usePlanNav';
import { PlannerScopeProvider } from '@/hooks/usePlannerScope';
import { PlannerSidebar } from './PlannerSidebar';

interface PlannerShellProps {
  children: React.ReactNode;
}

export function PlannerShell({ children }: PlannerShellProps) {
  return (
    <PlanNavProvider>
      <PlannerScopeProvider>
        <SidebarProvider>
          <PlannerSidebar />
          <SidebarInset className="bg-surface-canvas">{children}</SidebarInset>
        </SidebarProvider>
      </PlannerScopeProvider>
    </PlanNavProvider>
  );
}
