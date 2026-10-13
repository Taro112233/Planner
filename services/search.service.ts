// services/search.service.ts
// Search Service — Layer 2 (Business Logic + Database)
// Backs the sidebar's "ค้นหางาน / งานย่อย" box: cards whose title, or one of
// whose subtasks, contains the query — across every live plan in the
// workspace.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { TaskSearchResultDto } from '@/types/planner';

export const SEARCH_LIMIT = 12;

export async function searchTasks(
  organizationId: string,
  rawQuery: string,
  limit = SEARCH_LIMIT
): Promise<TaskSearchResultDto[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const contains = { contains: query, mode: 'insensitive' as const };

  const rows = await prisma.taskItem.findMany({
    where: {
      organizationId,
      deletedAt: null,
      group: { plan: { deletedAt: null } },
      OR: [{ title: contains }, { subtasks: { some: { title: contains } } }],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      group: {
        select: { name: true, color: true, planId: true, plan: { select: { name: true } } },
      },
      // Only the first matching subtask, to show why a card matched.
      subtasks: { where: { title: contains }, take: 1, select: { title: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    groupName: row.group.name,
    groupColor: row.group.color,
    planId: row.group.planId,
    planName: row.group.plan.name,
    matchedSubtask: row.subtasks[0]?.title ?? null,
  }));
}
