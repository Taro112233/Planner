// hooks/useMyTasks.ts
// The caller's open cards across every plan, bucketed by due date. Cached for
// the session (see useApiResource).

'use client';

import { useApiResource } from '@/hooks/useApiResource';
import type { MyTasksDto } from '@/types/planner';

export interface UseMyTasksReturn {
  data: MyTasksDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyTasks(): UseMyTasksReturn {
  const { data, loading, error, refetch } = useApiResource<MyTasksDto>('/api/my-tasks');
  return { data, loading, error, refetch };
}
