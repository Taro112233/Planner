// services/dashboard.service.test.ts
// Unit tests for DashboardService: the cross-plan "my tasks" buckets and the
// home summary counters.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { getMyTasks, getHomeSummary } from './dashboard.service';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const NOW = new Date('2026-08-25T10:00:00Z');

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    title: 'Design homepage',
    groupId: 'g-todo',
    dueDate: null,
    priority: 'MEDIUM',
    subtaskTotal: 0,
    subtaskDone: 0,
    group: {
      name: 'To Do',
      color: 'slate',
      planId: 'plan-1',
      plan: { name: 'แผนงานหลัก' },
    },
    ...overrides,
  };
}

/** One plan whose last column ("Done") is what marks a card complete. */
function mockPlansWithDoneColumn() {
  prismaMock.plan.findMany.mockResolvedValue([
    { groups: [{ id: 'g-todo' }, { id: 'g-doing' }, { id: 'g-done' }] },
  ] as never);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockPlansWithDoneColumn();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────
// getMyTasks
// ─────────────────────────────────────────────

describe('getMyTasks', () => {
  it('splits open work into overdue/today, this week and later', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      task({ id: 'overdue', dueDate: new Date('2026-08-20T00:00:00Z') }),
      // Noon UTC still falls on the same local day in both UTC and UTC+7, so
      // the bucket boundary (local end-of-day) holds wherever this runs.
      task({ id: 'today', dueDate: new Date('2026-08-25T12:00:00Z') }),
      task({ id: 'this-week', dueDate: new Date('2026-08-28T00:00:00Z') }),
      task({ id: 'far', dueDate: new Date('2026-09-30T00:00:00Z') }),
      task({ id: 'undated', dueDate: null }),
    ] as never);

    const result = await getMyTasks('org-1', 'ou-1');

    expect(result.overdue.map((t) => t.id)).toEqual(['overdue', 'today']);
    expect(result.week.map((t) => t.id)).toEqual(['this-week']);
    // Undated work has no deadline to sort by, so it sits with "later".
    expect(result.later.map((t) => t.id)).toEqual(['far', 'undated']);
    expect(result.openCount).toBe(5);
  });

  it('excludes cards sitting in their plan\'s last column', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      task({ id: 'open', groupId: 'g-todo' }),
      task({ id: 'finished', groupId: 'g-done' }),
    ] as never);

    const result = await getMyTasks('org-1', 'ou-1');

    expect(result.openCount).toBe(1);
    expect(result.doneCount).toBe(1);
    expect(result.later.map((t) => t.id)).toEqual(['open']);
  });

  it('only reads cards assigned to the caller, and never trashed ones', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([] as never);

    await getMyTasks('org-1', 'ou-1');

    expect(prismaMock.taskItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          deletedAt: null,
          assignees: { some: { organizationUserId: 'ou-1' } },
        },
      })
    );
  });

  it('carries the plan and column each card belongs to', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([task()] as never);

    const [first] = (await getMyTasks('org-1', 'ou-1')).later;

    expect(first).toMatchObject({
      planId: 'plan-1',
      planName: 'แผนงานหลัก',
      groupName: 'To Do',
      groupColor: 'slate',
    });
  });
});

// ─────────────────────────────────────────────
// getHomeSummary
// ─────────────────────────────────────────────

describe('getHomeSummary', () => {
  beforeEach(() => {
    prismaMock.taskActivity.count.mockResolvedValue(4);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);
  });

  it('counts my open work, my overdue work and the team total', async () => {
    prismaMock.taskItem.findMany
      // mine
      .mockResolvedValueOnce([
        task({ id: 'mine-open', dueDate: null }),
        task({ id: 'mine-late', dueDate: new Date('2026-08-01T00:00:00Z') }),
        task({ id: 'mine-done', groupId: 'g-done' }),
      ] as never)
      // team
      .mockResolvedValueOnce([
        task({ id: 'team-1' }),
        task({ id: 'team-2' }),
        task({ id: 'team-done', groupId: 'g-done' }),
      ] as never);

    const result = await getHomeSummary('org-1', 'ou-1');

    expect(result.myOpenCount).toBe(2);
    expect(result.myOverdueCount).toBe(1);
    expect(result.teamOpenCount).toBe(2);
  });

  it('takes the ticked-today figure from the activity log', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([] as never);

    const result = await getHomeSummary('org-1', 'ou-1');

    expect(result.checkedTodayCount).toBe(4);
    expect(prismaMock.taskActivity.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', action: 'SUBTASK_CHECKED' }),
      })
    );
  });

  it('lists at most seven dated cards as due soon, across the whole workspace', async () => {
    const dated = Array.from({ length: 9 }, (_, index) =>
      task({ id: `team-${index}`, dueDate: new Date('2026-08-26T00:00:00Z') })
    );
    prismaMock.taskItem.findMany
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([...dated, task({ id: 'undated', dueDate: null })] as never);

    const result = await getHomeSummary('org-1', 'ou-1');

    expect(result.dueSoon).toHaveLength(7);
    // Undated cards have no deadline to be "due soon" for.
    expect(result.dueSoon.every((t) => t.dueDate !== null)).toBe(true);
  });
});
