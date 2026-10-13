// services/audit.service.ts
// Audit Service — Layer 2 (Business Logic + Database)
// Backs "ประวัติตรวจสอบ": every TaskActivity row in the workspace, filterable
// by kind of action and by who did it, and exportable as CSV.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Multi-tenant: every query is scoped by organizationId
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/server/prisma';
import type { ActivityAction, OrganizationRole, Prisma } from '@prisma/client';
import type { AuditCategory, AuditEntryDto } from '@/types/planner';

export const AUDIT_FORBIDDEN = 'Audit log requires an owner or admin';

/** Hard cap on one CSV export, so a huge workspace cannot exhaust memory. */
export const AUDIT_EXPORT_LIMIT = 5000;

/** Which actions each filter chip covers. 'all' is the absence of a filter. */
export const AUDIT_CATEGORY_ACTIONS: Record<Exclude<AuditCategory, 'all'>, ActivityAction[]> = {
  tick: ['SUBTASK_CHECKED', 'SUBTASK_UNCHECKED'],
  move: ['TASK_MOVED', 'TASK_STATUS_CHANGED', 'SUBTASK_MOVED'],
  columns: ['GROUP_CREATED', 'GROUP_RENAMED', 'GROUP_RECOLORED', 'GROUP_DELETED', 'GROUP_REORDERED'],
  tasks: [
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_ASSIGNED',
    'TASK_UNASSIGNED',
    'TASK_DELETED',
    'TASK_RESTORED',
    'TASK_PURGED',
    'SUBTASK_CREATED',
    'SUBTASK_RENAMED',
    'SUBTASK_DELETED',
  ],
  plans: ['PLAN_CREATED', 'PLAN_RENAMED', 'PLAN_DELETED'],
};

export interface AuditFilter {
  category?: AuditCategory;
  /** OrganizationUser id; omit for everyone. */
  actorId?: string;
  /** Only activity in this group's plans; omit for the whole workspace. */
  planGroupId?: string;
}

const AUDIT_SELECT = {
  id: true,
  action: true,
  actorId: true,
  actorNameSnapshot: true,
  actorAvatarSnapshot: true,
  actorRoleSnapshot: true,
  targetTitle: true,
  taskItemTitleSnapshot: true,
  planNameSnapshot: true,
  createdAt: true,
} satisfies Prisma.TaskActivitySelect;

type AuditRow = Prisma.TaskActivityGetPayload<{ select: typeof AUDIT_SELECT }>;

/**
 * The mockup gives audit access to admins and leads, not plain members.
 * @throws Error(AUDIT_FORBIDDEN)
 */
export function assertCanViewAuditLog(role: OrganizationRole): void {
  if (role !== 'OWNER' && role !== 'ADMIN') throw new Error(AUDIT_FORBIDDEN);
}

async function buildWhere(
  organizationId: string,
  filter: AuditFilter
): Promise<Prisma.TaskActivityWhereInput> {
  const where: Prisma.TaskActivityWhereInput = { organizationId };
  if (filter.planGroupId) {
    // TaskActivity.planId is denormalized, so a group is just its plan ids.
    const plans = await prisma.plan.findMany({
      where: { organizationId, planGroupId: filter.planGroupId },
      select: { id: true },
    });
    where.planId = { in: plans.map((plan) => plan.id) };
  }
  if (filter.category && filter.category !== 'all') {
    where.action = { in: AUDIT_CATEGORY_ACTIONS[filter.category] };
  }
  if (filter.actorId) where.actorId = filter.actorId;
  return where;
}

function serialize(row: AuditRow): AuditEntryDto {
  return {
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    actorNameSnapshot: row.actorNameSnapshot,
    actorAvatarUrl: row.actorAvatarSnapshot ?? null,
    actorRoleSnapshot: row.actorRoleSnapshot,
    targetTitle: row.targetTitle,
    taskTitle: row.taskItemTitleSnapshot,
    planName: row.planNameSnapshot,
    createdAt: row.createdAt.toISOString(),
  };
}

/** One page of the audit log, newest first. */
export async function listAuditLog(
  organizationId: string,
  filter: AuditFilter,
  page: { skip: number; take: number }
): Promise<{ items: AuditEntryDto[]; total: number }> {
  const where = await buildWhere(organizationId, filter);

  const [rows, total] = await Promise.all([
    prisma.taskActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: page.skip,
      take: page.take,
      select: AUDIT_SELECT,
    }),
    prisma.taskActivity.count({ where }),
  ]);

  return { items: rows.map(serialize), total };
}

/** Quote a CSV cell when it carries a delimiter, quote or line break. */
function csvCell(value: string | null): string {
  if (value === null) return '';
  // A leading =, +, - or @ would run as a formula when opened in Excel.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * The filtered log as CSV (newest first, at most AUDIT_EXPORT_LIMIT rows),
 * with a BOM so Excel reads the Thai text as UTF-8.
 */
export async function exportAuditLogCsv(
  organizationId: string,
  filter: AuditFilter
): Promise<string> {
  const rows = await prisma.taskActivity.findMany({
    where: await buildWhere(organizationId, filter),
    orderBy: { createdAt: 'desc' },
    take: AUDIT_EXPORT_LIMIT,
    select: AUDIT_SELECT,
  });

  const header = ['time', 'user', 'role', 'action', 'task', 'target', 'plan'];
  const lines = rows.map((row) =>
    [
      row.createdAt.toISOString(),
      row.actorNameSnapshot,
      row.actorRoleSnapshot,
      row.action,
      row.taskItemTitleSnapshot,
      row.targetTitle,
      row.planNameSnapshot,
    ]
      .map(csvCell)
      .join(',')
  );

  return `﻿${[header.join(','), ...lines].join('\r\n')}\r\n`;
}
