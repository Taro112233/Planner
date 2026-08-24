// app/my-tasks/layout.tsx
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function MyTasksLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
