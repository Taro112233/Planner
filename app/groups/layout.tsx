// app/groups/layout.tsx
// Group overviews render inside the same planner shell as /board.
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
