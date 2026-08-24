// app/plans/layout.tsx
// Plans render inside the same planner shell as /board.
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function PlansLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
