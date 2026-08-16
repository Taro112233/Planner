// components/PlannerShell/PlannerShell.tsx
// App shell for planner routes: a collapsible left sidebar plus an inset
// content area. The global AppHeader (app/layout.tsx) hides itself on
// /board routes, so this is the only chrome rendered there.
'use client';

import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { PlannerSidebar } from './PlannerSidebar';

interface PlannerShellProps {
  children: React.ReactNode;
}

export function PlannerShell({ children }: PlannerShellProps) {
  return (
    <SidebarProvider>
      <PlannerSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
