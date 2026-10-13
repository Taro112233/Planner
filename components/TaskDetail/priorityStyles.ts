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

/** Thai label shown wherever a priority is displayed. */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'ต่ำ',
  MEDIUM: 'กลาง',
  HIGH: 'สูง',
  URGENT: 'ด่วน',
};

/** Dot + text colour for the mockup's "● สูง" priority marker. */
export const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  LOW: 'var(--color-group-slate)',
  MEDIUM: 'var(--color-group-orange)',
  HIGH: 'var(--color-content-danger)',
  URGENT: 'var(--color-group-pink)',
};
