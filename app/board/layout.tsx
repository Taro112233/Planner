// app/board/layout.tsx
// Wraps every /board/* route in the planner app shell (sidebar + inset
// content area) so future planner routes inherit it without touching page.tsx.
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function BoardLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
