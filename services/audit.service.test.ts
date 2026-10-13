// services/audit.service.test.ts
// Unit tests for AuditService: access rule, filters, pagination and CSV export.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import {
  AUDIT_CATEGORY_ACTIONS,
  AUDIT_EXPORT_LIMIT,
  AUDIT_FORBIDDEN,
  assertCanViewAuditLog,
  exportAuditLogCsv,
  listAuditLog,
} from './audit.service';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-1',
    action: 'SUBTASK_CHECKED',
    actorId: 'ou-1',
    actorNameSnapshot: 'Ada Lovelace',
    actorAvatarSnapshot: null,
    actorRoleSnapshot: 'ADMIN',
    targetTitle: 'Write copy',
    taskItemTitleSnapshot: 'Landing page',
    planNameSnapshot: 'แผนงานหลัก',
    createdAt: new Date('2026-10-01T09:00:00Z'),
    ...overrides,
  };
}

describe('assertCanViewAuditLog', () => {
  it('lets owners and admins through', () => {
    expect(() => assertCanViewAuditLog('OWNER')).not.toThrow();
    expect(() => assertCanViewAuditLog('ADMIN')).not.toThrow();
  });

  it('blocks plain members', () => {
    expect(() => assertCanViewAuditLog('MEMBER')).toThrow(AUDIT_FORBIDDEN);
  });
});

describe('listAuditLog', () => {
  it('returns one page newest first with the total', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([row()] as never);
    prismaMock.taskActivity.count.mockResolvedValue(42);

    const result = await listAuditLog('org-1', {}, { skip: 20, take: 20 });

    expect(result.total).toBe(42);
    expect(result.items[0]).toEqual({
      id: 'act-1',
      action: 'SUBTASK_CHECKED',
      actorId: 'ou-1',
      actorNameSnapshot: 'Ada Lovelace',
      actorAvatarUrl: null,
      actorRoleSnapshot: 'ADMIN',
      targetTitle: 'Write copy',
      taskTitle: 'Landing page',
      planName: 'แผนงานหลัก',
      createdAt: '2026-10-01T09:00:00.000Z',
    });
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      })
    );
  });

  it('narrows by category and actor', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);
    prismaMock.taskActivity.count.mockResolvedValue(0);

    await listAuditLog('org-1', { category: 'tick', actorId: 'ou-2' }, { skip: 0, take: 20 });

    const where = {
      organizationId: 'org-1',
      action: { in: AUDIT_CATEGORY_ACTIONS.tick },
      actorId: 'ou-2',
    };
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where })
    );
    expect(prismaMock.taskActivity.count).toHaveBeenCalledWith({ where });
  });

  it("limits a group scope to that group's plans", async () => {
    prismaMock.plan.findMany.mockResolvedValue([{ id: 'p-1' }, { id: 'p-2' }] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);
    prismaMock.taskActivity.count.mockResolvedValue(0);

    await listAuditLog('org-1', { planGroupId: 'pg-1' }, { skip: 0, take: 20 });

    expect(prismaMock.plan.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planGroupId: 'pg-1' },
      select: { id: true },
    });
    expect(prismaMock.taskActivity.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planId: { in: ['p-1', 'p-2'] } },
    });
  });

  it('treats "all" as no category filter', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);
    prismaMock.taskActivity.count.mockResolvedValue(0);

    await listAuditLog('org-1', { category: 'all' }, { skip: 0, take: 20 });

    expect(prismaMock.taskActivity.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
  });
});

describe('exportAuditLogCsv', () => {
  it('writes a BOM, a header and one line per row, capped at the export limit', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([row()] as never);

    const csv = await exportAuditLogCsv('org-1', {});

    expect(csv.startsWith('﻿time,user,role,action,task,target,plan\r\n')).toBe(true);
    expect(csv).toContain(
      '2026-10-01T09:00:00.000Z,Ada Lovelace,ADMIN,SUBTASK_CHECKED,Landing page,Write copy,แผนงานหลัก'
    );
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: AUDIT_EXPORT_LIMIT })
    );
  });

  it('quotes delimiters and defuses spreadsheet formulas', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([
      row({ taskItemTitleSnapshot: 'a, "b"', targetTitle: '=HYPERLINK("x")', planNameSnapshot: null }),
    ] as never);

    const csv = await exportAuditLogCsv('org-1', {});

    expect(csv).toContain(`"a, ""b""","'=HYPERLINK(""x"")",\r\n`);
  });
});
