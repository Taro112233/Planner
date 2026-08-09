// components/PlannerShell/PlannerShell.tsx
// App shell for planner routes: a collapsible left sidebar plus an inset
// content area. Sits below the existing global AppHeader (app/layout.tsx) —
// this is a second, planner-scoped layer of chrome, not a replacement for it.
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
