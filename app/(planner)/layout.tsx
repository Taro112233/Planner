// app/(planner)/layout.tsx
// One planner shell for every signed-in route. A route group, so URLs are
// unchanged (/home, /plans/…, /audit, …) — but because the layout is shared,
// moving between pages keeps the sidebar mounted: its state (the group you
// are working in), and the data it already loaded, survive navigation.
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function PlannerLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
