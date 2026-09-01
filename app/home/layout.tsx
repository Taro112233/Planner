// app/home/layout.tsx
import type { ReactNode } from 'react';
import { PlannerShell } from '@/components/PlannerShell';

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <PlannerShell>{children}</PlannerShell>;
}
