// services/inbox.service.ts
// Inbox Service — Layer 2 (Business Logic + Database)
// Backs "การแจ้งเตือน": what other members did to cards assigned to the
// viewer. Derived from TaskActivity, so it needs no table of its own; which
// items are "read" is a per-browser concern kept on the client.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { InboxItemDto } from '@/types/planner';

export const INBOX_LIMIT = 50;

export async function listInbox(
  organizationId: string,
  organizationUserId: string,
  limit = INBOX_LIMIT
): Promise<InboxItemDto[]> {
  const assignments = await prisma.taskAssignee.findMany({
    where: { organizationId, organizationUserId, taskItem: { deletedAt: null } },
    select: { taskItemId: true },
  });
  if (assignments.length === 0) return [];

  const rows = await prisma.taskActivity.findMany({
    where: {
      organizationId,
      taskItemId: { in: assignments.map((assignment) => assignment.taskItemId) },
      // Your own actions are not news to you.
      actorId: { not: organizationUserId },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      taskItemId: true,
      actorNameSnapshot: true,
      actorAvatarSnapshot: true,
      targetTitle: true,
      taskItemTitleSnapshot: true,
      planNameSnapshot: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    taskItemId: row.taskItemId,
    actorNameSnapshot: row.actorNameSnapshot,
    actorAvatarUrl: row.actorAvatarSnapshot ?? null,
    targetTitle: row.targetTitle,
    taskTitle: row.taskItemTitleSnapshot,
    planName: row.planNameSnapshot,
    createdAt: row.createdAt.toISOString(),
  }));
}
