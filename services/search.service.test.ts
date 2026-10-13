// services/search.service.test.ts
// Unit tests for SearchService. Prisma is fully mocked.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { searchTasks } from './search.service';

describe('searchTasks', () => {
  it('returns nothing for a blank query without touching the database', async () => {
    await expect(searchTasks('org-1', '   ')).resolves.toEqual([]);
    expect(prismaMock.taskItem.findMany).not.toHaveBeenCalled();
  });

  it('matches title or subtask, case-insensitively, within live plans', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      {
        id: 't-1',
        title: 'Landing page',
        group: { name: 'To Do', color: 'slate', planId: 'p-1', plan: { name: 'แผนงานหลัก' } },
        subtasks: [{ title: 'Write copy' }],
      },
    ] as never);

    const [hit] = await searchTasks('org-1', ' copy ');

    expect(hit).toEqual({
      id: 't-1',
      title: 'Landing page',
      groupName: 'To Do',
      groupColor: 'slate',
      planId: 'p-1',
      planName: 'แผนงานหลัก',
      matchedSubtask: 'Write copy',
    });
    const contains = { contains: 'copy', mode: 'insensitive' };
    expect(prismaMock.taskItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          deletedAt: null,
          group: { plan: { deletedAt: null } },
          OR: [{ title: contains }, { subtasks: { some: { title: contains } } }],
        },
      })
    );
  });
});
