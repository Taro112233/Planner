// services/report.service.test.ts
// Unit tests for ReportService. Prisma is fully mocked.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { getReport } from './report.service';

const NOW = new Date(2026, 9, 13, 15, 0, 0);

function arrange() {
  prismaMock.organizationUser.findMany.mockResolvedValue([
    { id: 'ou-1', firstName: 'Ada', lastName: 'L', user: { image: null } },
    { id: 'ou-2', firstName: 'Bob', lastName: 'K', user: { image: null } },
  ] as never);
  prismaMock.plan.findMany.mockResolvedValue([
    {
      id: 'p-1',
      groups: [
        { id: 'todo', name: 'To Do', color: 'slate' },
        { id: 'done', name: 'Done', color: 'green' },
      ],
    },
    { id: 'p-2', groups: [{ id: 'todo-2', name: 'To Do', color: 'slate' }, { id: 'done-2', name: 'Done', color: 'green' }] },
  ] as never);
  prismaMock.taskItem.findMany.mockResolvedValue([
    { groupId: 'todo', assignees: [{ organizationUserId: 'ou-2' }] },
    { groupId: 'todo-2', assignees: [{ organizationUserId: 'ou-2' }, { organizationUserId: 'ou-1' }] },
    { groupId: 'done', assignees: [{ organizationUserId: 'ou-1' }] },
  ] as never);
  prismaMock.taskActivity.findMany.mockResolvedValue([
    { actorId: 'ou-1', actorNameSnapshot: 'Ada L', actorAvatarSnapshot: null, createdAt: new Date(2026, 9, 13, 9) },
    { actorId: 'ou-1', actorNameSnapshot: 'Ada L', actorAvatarSnapshot: null, createdAt: new Date(2026, 9, 12, 9) },
    { actorId: 'ou-2', actorNameSnapshot: 'Bob K', actorAvatarSnapshot: null, createdAt: new Date(2026, 9, 1, 9) },
  ] as never);
}

describe('getReport', () => {
  it('counts open cards per member, ignoring the done column', async () => {
    arrange();
    const report = await getReport('org-1', NOW);

    expect(report.workload).toEqual([
      expect.objectContaining({ organizationUserId: 'ou-2', openCount: 2 }),
      expect.objectContaining({ organizationUserId: 'ou-1', openCount: 1 }),
    ]);
  });

  it('merges same-named columns across plans', async () => {
    arrange();
    const report = await getReport('org-1', NOW);

    expect(report.columns).toEqual([
      { name: 'To Do', color: 'slate', count: 2 },
      { name: 'Done', color: 'green', count: 1 },
    ]);
  });

  it('scopes plans, people and ticks to a group', async () => {
    arrange();
    await getReport('org-1', NOW, 'pg-1');

    expect(prismaMock.plan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', deletedAt: null, planGroupId: 'pg-1' },
      })
    );
    expect(prismaMock.organizationUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ planGroupMembers: { some: { planGroupId: 'pg-1' } } }),
      })
    );
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ planId: { in: ['p-1', 'p-2'] } }) })
    );
  });

  it('ranks tickers over the window and buckets the last seven days', async () => {
    arrange();
    const report = await getReport('org-1', NOW);

    expect(report.topTickers.map((t) => [t.organizationUserId, t.count])).toEqual([
      ['ou-1', 2],
      ['ou-2', 1],
    ]);
    expect(report.dailyTicks).toHaveLength(7);
    expect(report.dailyTicks.map((d) => d.count)).toEqual([0, 0, 0, 0, 0, 1, 1]);
  });
});
