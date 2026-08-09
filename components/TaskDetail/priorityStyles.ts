// components/TaskDetail/priorityStyles.ts
// Shared Tailwind class map for TaskPriority chips — used by the Kanban card,
// the slide-over panel, and the full TaskPage so the four priority colors
// never drift between surfaces.

import type { TaskPriority } from '@/types/planner';

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: 'bg-surface-tertiary text-content-secondary',
  MEDIUM: 'bg-surface-warning text-content-warning',
  HIGH: 'bg-surface-danger-subtle text-content-danger',
  URGENT: 'bg-surface-danger text-content-inverse',
};
