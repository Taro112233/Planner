// services/task-template.service.test.ts
// Unit tests for TaskTemplateService: blueprint round-tripping and stamping a
// template out as a real card with correct counters.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock, mockTransactionPassthrough } from '@/tests/prisma-mock';

import {
  listTaskTemplates,
  createTaskTemplate,
  deleteTaskTemplate,
  createTaskFromTemplate,
} from './task-template.service';
import type { ActorInput } from './board.service';

const ACTOR: ActorInput = {
  organizationUserId: 'ou-actor',
  userId: 'user-actor',
  name: 'Actor Name',
  avatarUrl: null,
  role: 'MEMBER',
};

/** What getTaskDetail reads back after the card is stamped out. */
const FULL_TASK_ROW = {
  id: 'task-new',
  groupId: 'group-1',
  title: 'ออกแบบหน้าใหม่',
  description: null,
  status: 'TODO',
  priority: 'HIGH',
  position: new Prisma.Decimal(4),
  startDate: null,
  dueDate: null,
  subtaskTotal: 2,
  subtaskDone: 0,
  createdAt: new Date('2026-08-25T00:00:00Z'),
  updatedAt: new Date('2026-08-25T00:00:00Z'),
  assignees: [],
  badges: [],
  subtasks: [],
};

const TEMPLATE_ROW = {
  id: 'tpl-1',
  name: 'งานออกแบบ',
  title: 'ออกแบบหน้าใหม่',
  priority: 'HIGH',
  subtasks: [
    { title: 'ร่างแบบ', children: [{ title: 'หา reference', children: [] }] },
    { title: 'รีวิว', children: [] },
  ],
  sortOrder: 0,
};

describe('listTaskTemplates', () => {
  it('parses the stored blueprint into nodes', async () => {
    prismaMock.taskTemplate.findMany.mockResolvedValue([TEMPLATE_ROW] as never);

    const [template] = await listTaskTemplates('org-1');

    expect(template.subtasks).toHaveLength(2);
    expect(template.subtasks[0].children[0].title).toBe('หา reference');
  });

  it('drops malformed or over-deep nodes rather than trusting the JSON column', async () => {
    prismaMock.taskTemplate.findMany.mockResolvedValue([
      {
        ...TEMPLATE_ROW,
        subtasks: [
          'not an object',
          { title: '   ' },
          {
            title: 'ok',
            children: [{ title: 'child', children: [{ title: 'grand', children: [
              { title: 'too deep', children: [] },
            ] }] }],
          },
        ],
      },
    ] as never);

    const [template] = await listTaskTemplates('org-1');

    expect(template.subtasks).toHaveLength(1);
    const grandchild = template.subtasks[0].children[0].children[0];
    expect(grandchild.title).toBe('grand');
    // Depth stops at 2 — the Subtask tree cannot hold a fourth level.
    expect(grandchild.children).toEqual([]);
  });
});

describe('createTaskTemplate', () => {
  beforeEach(() => {
    prismaMock.taskTemplate.findFirst.mockResolvedValue({ sortOrder: 1 } as never);
    prismaMock.taskTemplate.create.mockResolvedValue(TEMPLATE_ROW as never);
  });

  it('appends after the last template and stores a trimmed blueprint', async () => {
    await createTaskTemplate('org-1', {
      name: 'งานออกแบบ',
      title: 'ออกแบบหน้าใหม่',
      subtasks: [{ title: '  ร่างแบบ  ', children: [{ title: '', children: [] }] }],
    });

    const { data } = prismaMock.taskTemplate.create.mock.calls[0][0];
    expect(data.sortOrder).toBe(2);
    expect(data.subtasks).toEqual([{ title: 'ร่างแบบ', children: [] }]);
  });

  it('omits priority when not given so the column default stands', async () => {
    await createTaskTemplate('org-1', { name: 'x', title: 'y' });

    expect('priority' in prismaMock.taskTemplate.create.mock.calls[0][0].data).toBe(false);
  });

  it('throws "Duplicate entry" when the name collides', async () => {
    prismaMock.taskTemplate.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    await expect(createTaskTemplate('org-1', { name: 'ซ้ำ', title: 'x' })).rejects.toThrow(
      'Duplicate entry'
    );
  });
});

describe('deleteTaskTemplate', () => {
  it('throws "Template not found" for a template outside the organization', async () => {
    prismaMock.taskTemplate.findFirst.mockResolvedValue(null);

    await expect(deleteTaskTemplate('org-1', 'ghost')).rejects.toThrow('Template not found');
    expect(prismaMock.taskTemplate.delete).not.toHaveBeenCalled();
  });
});

describe('createTaskFromTemplate', () => {
  beforeEach(() => {
    prismaMock.taskTemplate.findFirst.mockResolvedValue(TEMPLATE_ROW as never);
    prismaMock.group.findFirst.mockResolvedValue({
      id: 'group-1',
      planId: 'plan-1',
      plan: { name: 'แผนงานหลัก' },
    } as never);
    // First call finds the last position; the second is getTaskDetail reading
    // the freshly created card back.
    prismaMock.taskItem.findFirst
      .mockResolvedValueOnce({ position: new Prisma.Decimal(3) } as never)
      .mockResolvedValue(FULL_TASK_ROW as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);
    prismaMock.taskItem.create.mockResolvedValue({ id: 'task-new' } as never);
    prismaMock.subtask.create.mockResolvedValue({ id: 'st-new' } as never);
    mockTransactionPassthrough();
  });

  it('creates the card after the last position, counting only root subtasks', async () => {
    await createTaskFromTemplate('org-1', 'group-1', 'tpl-1', ACTOR);

    const { data } = prismaMock.taskItem.create.mock.calls[0][0];
    expect(String(data.position)).toBe('4');
    expect(data.title).toBe('ออกแบบหน้าใหม่');
    expect(data.priority).toBe('HIGH');
    // Two roots; the nested child does not count (invariant I6).
    expect(data.subtaskTotal).toBe(2);
  });

  it('creates every node with the right depth and direct-child count', async () => {
    await createTaskFromTemplate('org-1', 'group-1', 'tpl-1', ACTOR);

    const created = prismaMock.subtask.create.mock.calls.map((call) => call[0].data);
    expect(created).toHaveLength(3);
    expect(created[0]).toMatchObject({ title: 'ร่างแบบ', depth: 0, childTotal: 1 });
    expect(created[1]).toMatchObject({ title: 'หา reference', depth: 1, childTotal: 0 });
    expect(created[2]).toMatchObject({ title: 'รีวิว', depth: 0, childTotal: 0 });
  });

  it('logs one TASK_CREATED naming the template it came from', async () => {
    await createTaskFromTemplate('org-1', 'group-1', 'tpl-1', ACTOR);

    expect(prismaMock.taskActivity.create).toHaveBeenCalledTimes(1);
    const { data } = prismaMock.taskActivity.create.mock.calls[0][0];
    expect(data).toMatchObject({ action: 'TASK_CREATED', planId: 'plan-1' });
    expect(data.changes).toMatchObject({ fromTemplate: 'งานออกแบบ', subtaskCount: 2 });
  });

  it('throws "Group not found" for a column outside the organization', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);

    await expect(createTaskFromTemplate('org-1', 'ghost', 'tpl-1', ACTOR)).rejects.toThrow(
      'Group not found'
    );
    expect(prismaMock.taskItem.create).not.toHaveBeenCalled();
  });

  it('throws "Template not found" before touching the board', async () => {
    prismaMock.taskTemplate.findFirst.mockResolvedValue(null);

    await expect(createTaskFromTemplate('org-1', 'group-1', 'ghost', ACTOR)).rejects.toThrow(
      'Template not found'
    );
    expect(prismaMock.taskItem.create).not.toHaveBeenCalled();
  });
});
