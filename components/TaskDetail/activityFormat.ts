// components/TaskDetail/activityFormat.ts
// Human-readable label for a TaskActivityDto row. Shared by TaskDetailModal
// (latest 10) and TaskPage's full paginated activity feed.

import type { TaskActivityDto } from '@/types/planner';

export function formatActivity(activity: TaskActivityDto): string {
  const target = activity.targetTitle ? ` "${activity.targetTitle}"` : '';
  switch (activity.action) {
    case 'TASK_CREATED':
      return 'created this task';
    case 'TASK_UPDATED':
      return 'updated this task';
    case 'TASK_STATUS_CHANGED':
      return 'changed the status';
    case 'TASK_MOVED':
      return 'moved this task';
    case 'TASK_ASSIGNED':
      return 'assigned a member';
    case 'TASK_UNASSIGNED':
      return 'unassigned a member';
    case 'TASK_DELETED':
      return 'deleted this task';
    case 'TASK_RESTORED':
      return 'restored this task';
    case 'TASK_PURGED':
      return 'permanently deleted this task';
    case 'SUBTASK_CREATED':
      return `added subtask${target}`;
    case 'SUBTASK_RENAMED':
      return `renamed a subtask${target}`;
    case 'SUBTASK_CHECKED':
      return `checked${target}`;
    case 'SUBTASK_UNCHECKED':
      return `unchecked${target}`;
    case 'SUBTASK_MOVED':
      return `moved a subtask${target}`;
    case 'SUBTASK_DELETED':
      return `deleted a subtask${target}`;
    default:
      // ActivityActionValue is exhausted above, so `action` narrows to never
      // here. Kept as a runtime guard for enum values added server-side before
      // this file learns about them — hence String() rather than a method call.
      return String(activity.action).replace(/_/g, ' ').toLowerCase();
  }
}
