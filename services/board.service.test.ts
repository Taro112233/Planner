// services/board.service.test.ts
// Unit tests for BoardService: board/group reads, task creation and moves,
// field edits, the subtask tree and activity paging. The trash lifecycle lives
// in board.service.trash.test.ts to keep both files navigable.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock, mockTransactionPassthrough } from '@/tests/prisma-mock';

import {
  getBoard,
  createGroup,
  listGroups,
  createTask,
  moveTask,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskPriority,
  updateTaskDates,
  getTaskDetail,
  listTaskActivity,
  setSubtaskDone,
  assignTask,
  unassignTask,
  addSubtask,
  renameSubtask,
  deleteSubtask,
  type ActorInput,
} from './board.service';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const ACTOR: ActorInput = {
  organizationUserId: 'ou-actor',
  userId: 'user-actor',
  name: 'Actor Name',
  avatarUrl: null,
  role: 'MEMBER',
};

const FULL_TASK_ROW = {
  id: 'task-1',
  groupId: 'group-1',
  title: 'Design homepage',
  description: 'Some description',
  status: 'TODO',
  priority: 'MEDIUM',
  position: new Prisma.Decimal(1),
  startDate: null,
  dueDate: null,
  subtaskTotal: 0,
  subtaskDone: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  assignees: [],
  badges: [],
};

beforeEach(() => {
  prismaMock.taskItem.findFirst.mockResolvedValue(FULL_TASK_ROW as never);
  prismaMock.subtask.findMany.mockResolvedValue([]);
  prismaMock.taskActivity.findMany.mockResolvedValue([]);
});

// ─────────────────────────────────────────────
// assignTask
// ─────────────────────────────────────────────

describe('assignTask', () => {
  it('creates a TaskAssignee row and a TASK_ASSIGNED activity, then returns the task detail', async () => {
    mockTransactionPassthrough();

    const result = await assignTask('org-1', 'task-1', 'ou-2', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.taskAssignee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskItemId: 'task-1',
          organizationId: 'org-1',
          organizationUserId: 'ou-2',
          assignedById: ACTOR.organizationUserId,
        }),
      })
    );
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_ASSIGNED' }) })
    );
  });

  it('throws "Task not found" when the task does not belong to the organization', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(assignTask('org-1', 'missing', 'ou-2', ACTOR)).rejects.toThrow('Task not found');
  });

  it('throws "Already assigned" on a duplicate assignment (P2002)', async () => {
    (prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) => {
        prismaMock.taskAssignee.create.mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '5.0.0',
          })
        );
        return callback(prismaMock);
      }
    );

    await expect(assignTask('org-1', 'task-1', 'ou-2', ACTOR)).rejects.toThrow('Already assigned');
  });

  it('re-throws non-unique-constraint database errors untouched', async () => {
    (prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) => {
        prismaMock.taskAssignee.create.mockRejectedValueOnce(new Error('connection reset'));
        return callback(prismaMock);
      }
    );

    await expect(assignTask('org-1', 'task-1', 'ou-2', ACTOR)).rejects.toThrow('connection reset');
  });
});

// ─────────────────────────────────────────────
// unassignTask
// ─────────────────────────────────────────────

describe('unassignTask', () => {
  it('deletes the TaskAssignee row and logs a TASK_UNASSIGNED activity', async () => {
    prismaMock.taskAssignee.findFirst.mockResolvedValue({
      taskItemId: 'task-1',
      organizationUserId: 'ou-2',
    } as never);
    mockTransactionPassthrough();

    const result = await unassignTask('org-1', 'task-1', 'ou-2', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.taskAssignee.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskItemId_organizationUserId: { taskItemId: 'task-1', organizationUserId: 'ou-2' } },
      })
    );
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_UNASSIGNED' }) })
    );
  });

  it('throws "Task not found" when the task does not belong to the organization', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(unassignTask('org-1', 'missing', 'ou-2', ACTOR)).rejects.toThrow('Task not found');
  });

  it('throws "Assignment not found" when the member is not currently assigned', async () => {
    prismaMock.taskAssignee.findFirst.mockResolvedValue(null);

    await expect(unassignTask('org-1', 'task-1', 'ou-2', ACTOR)).rejects.toThrow('Assignment not found');
  });
});

// ─────────────────────────────────────────────
// addSubtask
// ─────────────────────────────────────────────

describe('addSubtask', () => {
  it('creates a root-level subtask, increments subtaskTotal, and logs SUBTASK_CREATED', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue(null);
    mockTransactionPassthrough();

    const result = await addSubtask('org-1', 'task-1', 'Write copy', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.subtask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskItemId: 'task-1',
          organizationId: 'org-1',
          title: 'Write copy',
          depth: 0,
          createdById: ACTOR.organizationUserId,
        }),
      })
    );
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { subtaskTotal: { increment: 1 } },
      })
    );
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'SUBTASK_CREATED', targetTitle: 'Write copy' }),
      })
    );
  });

  it('positions a new subtask after the last existing root sibling', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({ position: new Prisma.Decimal(3) } as never);
    mockTransactionPassthrough();

    await addSubtask('org-1', 'task-1', 'Another subtask', ACTOR);

    const createCall = prismaMock.subtask.create.mock.calls[0][0];
    expect((createCall.data as { position: Prisma.Decimal }).position.toString()).toBe('4');
  });

  it('throws "Task not found" when the task does not belong to the organization', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(addSubtask('org-1', 'missing', 'Write copy', ACTOR)).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// getBoard / listGroups
// ─────────────────────────────────────────────

describe('getBoard', () => {
  it('serializes groups with their cards and excludes trashed tasks', async () => {
    prismaMock.group.findMany.mockResolvedValue([
      {
        id: 'group-1',
        name: 'Todo',
        color: '#fff',
        icon: null,
        wipLimit: null,
        sortOrder: 0,
        taskItems: [FULL_TASK_ROW],
      },
    ] as never);

    const result = await getBoard('org-1', 'plan-1');

    expect(result.organizationId).toBe('org-1');
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].taskItems[0]).toMatchObject({
      id: 'task-1',
      // Decimal is serialized to a string for the wire
      position: '1',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    // Trashed cards must never reach the board.
    const call = prismaMock.group.findMany.mock.calls[0][0] as {
      select: { taskItems: { where: unknown } };
    };
    expect(call.select.taskItems.where).toEqual({ deletedAt: null });
  });
});

describe('listGroups', () => {
  it('returns lightweight column summaries without querying taskItems', async () => {
    prismaMock.group.findMany.mockResolvedValue([
      { id: 'group-1', name: 'Todo', color: null, sortOrder: 0 },
    ] as never);

    const result = await listGroups('org-1', 'plan-1');

    expect(result).toEqual([{ id: 'group-1', name: 'Todo', color: null, sortOrder: 0 }]);
    expect(prismaMock.group.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planId: 'plan-1' },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, color: true, sortOrder: true },
    });
  });
});

// ─────────────────────────────────────────────
// createGroup
// ─────────────────────────────────────────────

describe('createGroup', () => {
  const CREATED_GROUP = {
    id: 'group-2',
    name: 'In Progress',
    color: null,
    icon: null,
    wipLimit: null,
    sortOrder: 3,
  };

  it('appends the column after the current last sortOrder', async () => {
    prismaMock.group.findFirst.mockResolvedValue({ sortOrder: 2 } as never);
    prismaMock.group.create.mockResolvedValue(CREATED_GROUP as never);

    const result = await createGroup('org-1', 'plan-1', 'In Progress', null);

    expect(result.taskItems).toEqual([]);
    expect(prismaMock.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'In Progress',
          sortOrder: 3,
        }),
      })
    );
  });

  it('starts at sortOrder 0 for the first column', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);
    prismaMock.group.create.mockResolvedValue({ ...CREATED_GROUP, sortOrder: 0 } as never);

    await createGroup('org-1', 'plan-1', 'Todo', null);

    expect(prismaMock.group.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 0 }) })
    );
  });

  it('throws "Duplicate entry" when the name collides (P2002)', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);
    prismaMock.group.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      })
    );

    await expect(createGroup('org-1', 'plan-1', 'Todo', null)).rejects.toThrow('Duplicate entry');
  });

  it('re-throws non-unique-constraint database errors untouched', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);
    prismaMock.group.create.mockRejectedValue(new Error('connection reset'));

    await expect(createGroup('org-1', 'plan-1', 'Todo', null)).rejects.toThrow('connection reset');
  });
});

// ─────────────────────────────────────────────
// createTask
// ─────────────────────────────────────────────

describe('createTask', () => {
  it('appends the card after the last position and logs TASK_CREATED', async () => {
    prismaMock.group.findFirst.mockResolvedValue({ id: 'group-1' } as never);
    prismaMock.taskItem.findFirst.mockResolvedValue({ position: new Prisma.Decimal(4) } as never);
    prismaMock.taskItem.create.mockResolvedValue(FULL_TASK_ROW as never);
    mockTransactionPassthrough();

    const result = await createTask('org-1', 'group-1', 'New card', ACTOR);

    expect(result.id).toBe('task-1');
    const createCall = prismaMock.taskItem.create.mock.calls[0][0];
    expect((createCall.data as { position: Prisma.Decimal }).position.toString()).toBe('5');
    expect(createCall.data).toMatchObject({
      organizationId: 'org-1',
      groupId: 'group-1',
      title: 'New card',
      createdById: ACTOR.organizationUserId,
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_CREATED' }) })
    );
  });

  it('omits priority entirely when the caller does not pass one, so the DB default stands', async () => {
    prismaMock.group.findFirst.mockResolvedValue({ id: 'group-1' } as never);
    prismaMock.taskItem.findFirst.mockResolvedValue(null);
    prismaMock.taskItem.create.mockResolvedValue(FULL_TASK_ROW as never);
    mockTransactionPassthrough();

    await createTask('org-1', 'group-1', 'New card', ACTOR);

    const data = prismaMock.taskItem.create.mock.calls[0][0].data as Record<string, unknown>;
    expect('priority' in data).toBe(false);
  });

  it('writes an explicit priority when one is passed', async () => {
    prismaMock.group.findFirst.mockResolvedValue({ id: 'group-1' } as never);
    prismaMock.taskItem.findFirst.mockResolvedValue(null);
    prismaMock.taskItem.create.mockResolvedValue({ ...FULL_TASK_ROW, priority: 'URGENT' } as never);
    mockTransactionPassthrough();

    const result = await createTask('org-1', 'group-1', 'New card', ACTOR, 'URGENT');

    expect(result.priority).toBe('URGENT');
    expect(prismaMock.taskItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ priority: 'URGENT' }) })
    );
    // The activity row records what the card was actually created with.
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'TASK_CREATED', changes: { priority: 'URGENT' } }),
      })
    );
  });

  it('throws "Group not found" when the column is not in the organization', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);

    await expect(createTask('org-1', 'ghost', 'New card', ACTOR)).rejects.toThrow('Group not found');
  });
});

// ─────────────────────────────────────────────
// moveTask
// ─────────────────────────────────────────────

describe('moveTask', () => {
  beforeEach(() => {
    prismaMock.group.findFirst.mockResolvedValue({ id: 'group-2' } as never);
    prismaMock.taskItem.update.mockResolvedValue(FULL_TASK_ROW as never);
  });

  it('halves the gap between the two neighbours at the target index', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      { position: new Prisma.Decimal(1) },
      { position: new Prisma.Decimal(2) },
    ] as never);
    mockTransactionPassthrough();

    const result = await moveTask('org-1', 'task-1', 'group-2', 1, ACTOR);

    expect(result.id).toBe('task-1');
    const updateCall = prismaMock.taskItem.update.mock.calls[0][0];
    expect((updateCall.data as { position: Prisma.Decimal }).position.toString()).toBe('1.5');
    expect(updateCall.data).toMatchObject({ groupId: 'group-2', version: { increment: 1 } });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_MOVED' }) })
    );
  });

  it('ignores trashed cards when computing the insert position', async () => {
    // Regression guard: with the trashed card at 2 included, dropping at the
    // end of the visible [1, 3] list would yield 2.5 and sort *before* card 3.
    prismaMock.taskItem.findMany.mockResolvedValue([
      { position: new Prisma.Decimal(1) },
      { position: new Prisma.Decimal(3) },
    ] as never);
    mockTransactionPassthrough();

    await moveTask('org-1', 'task-1', 'group-2', 2, ACTOR);

    expect(prismaMock.taskItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    );
    const updateCall = prismaMock.taskItem.update.mock.calls[0][0];
    expect((updateCall.data as { position: Prisma.Decimal }).position.toString()).toBe('4');
  });

  it('uses position 1 when the target column is empty', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([] as never);
    mockTransactionPassthrough();

    await moveTask('org-1', 'task-1', 'group-2', 0, ACTOR);

    const updateCall = prismaMock.taskItem.update.mock.calls[0][0];
    expect((updateCall.data as { position: Prisma.Decimal }).position.toString()).toBe('1');
  });

  it('throws "Task not found" for a task outside the organization', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(moveTask('org-1', 'ghost', 'group-2', 0, ACTOR)).rejects.toThrow('Task not found');
  });

  it('throws "Group not found" for a target column outside the organization', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);

    await expect(moveTask('org-1', 'task-1', 'ghost', 0, ACTOR)).rejects.toThrow('Group not found');
  });
});

// ─────────────────────────────────────────────
// Field edits — title / description / priority / dates
// ─────────────────────────────────────────────

describe('updateTaskTitle', () => {
  it('writes the title and a TASK_UPDATED activity recording before/after', async () => {
    mockTransactionPassthrough();

    const result = await updateTaskTitle('org-1', 'task-1', 'Redesign homepage', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { title: 'Redesign homepage', version: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TASK_UPDATED',
          changes: { field: 'title', before: 'Design homepage', after: 'Redesign homepage' },
        }),
      })
    );
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(updateTaskTitle('org-1', 'ghost', 'x', ACTOR)).rejects.toThrow('Task not found');
  });
});

describe('updateTaskDescription', () => {
  it('accepts null to clear the description', async () => {
    mockTransactionPassthrough();

    await updateTaskDescription('org-1', 'task-1', null, ACTOR);

    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { description: null, version: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TASK_UPDATED',
          changes: { field: 'description', before: 'Some description', after: null },
        }),
      })
    );
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(updateTaskDescription('org-1', 'ghost', 'x', ACTOR)).rejects.toThrow(
      'Task not found'
    );
  });
});

describe('updateTaskPriority', () => {
  it('writes the priority and logs the previous value', async () => {
    mockTransactionPassthrough();

    await updateTaskPriority('org-1', 'task-1', 'URGENT', ACTOR);

    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { priority: 'URGENT', version: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: { field: 'priority', before: 'MEDIUM', after: 'URGENT' },
        }),
      })
    );
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(updateTaskPriority('org-1', 'ghost', 'LOW', ACTOR)).rejects.toThrow(
      'Task not found'
    );
  });
});

describe('updateTaskDates', () => {
  it('converts ISO strings to Date objects and leaves nulls alone', async () => {
    mockTransactionPassthrough();

    await updateTaskDates(
      'org-1',
      'task-1',
      { startDate: '2024-03-01T00:00:00.000Z', dueDate: null },
      ACTOR
    );

    const updateCall = prismaMock.taskItem.update.mock.calls[0][0];
    const data = updateCall.data as { startDate: Date | null; dueDate: Date | null };
    expect(data.startDate).toBeInstanceOf(Date);
    expect(data.startDate?.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    expect(data.dueDate).toBeNull();
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_UPDATED' }) })
    );
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(
      updateTaskDates('org-1', 'ghost', { startDate: null, dueDate: null }, ACTOR)
    ).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// getTaskDetail
// ─────────────────────────────────────────────

describe('getTaskDetail', () => {
  it('assembles the flat subtask rows into a depth-2 tree', async () => {
    prismaMock.subtask.findMany.mockResolvedValue([
      {
        id: 'st-root',
        parentSubtaskId: null,
        title: 'Root',
        isDone: false,
        depth: 0,
        childTotal: 1,
        childDone: 0,
      },
      {
        id: 'st-child',
        parentSubtaskId: 'st-root',
        title: 'Child',
        isDone: false,
        depth: 1,
        childTotal: 1,
        childDone: 0,
      },
      {
        id: 'st-grandchild',
        parentSubtaskId: 'st-child',
        title: 'Grandchild',
        isDone: true,
        depth: 2,
        childTotal: 0,
        childDone: 0,
      },
    ] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        action: 'TASK_CREATED',
        actorNameSnapshot: 'Actor Name',
        targetTitle: null,
        createdAt: new Date('2024-01-03T00:00:00Z'),
      },
    ] as never);

    const result = await getTaskDetail('org-1', 'task-1');

    expect(result.subtasks).toHaveLength(1);
    expect(result.subtasks[0].id).toBe('st-root');
    expect(result.subtasks[0].children[0].id).toBe('st-child');
    expect(result.subtasks[0].children[0].children[0].id).toBe('st-grandchild');
    expect(result.description).toBe('Some description');
    expect(result.activities).toEqual([
      {
        id: 'act-1',
        action: 'TASK_CREATED',
        actorNameSnapshot: 'Actor Name',
        actorAvatarUrl: null,
        targetTitle: null,
        createdAt: '2024-01-03T00:00:00.000Z',
      },
    ]);
  });

  it('carries the checked-by snapshot and checkedAt onto the tree node', async () => {
    prismaMock.subtask.findMany.mockResolvedValue([
      {
        id: 'st-done',
        parentSubtaskId: null,
        title: 'Done root',
        isDone: true,
        depth: 0,
        childTotal: 0,
        childDone: 0,
        checkedByNameSnapshot: 'Ada Lovelace',
        checkedByAvatarSnapshot: 'https://example.test/ada.png',
        checkedAt: new Date('2024-02-01T08:30:00Z'),
      },
    ] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);

    const result = await getTaskDetail('org-1', 'task-1');

    expect(result.subtasks[0]).toMatchObject({
      checkedByName: 'Ada Lovelace',
      checkedByAvatarUrl: 'https://example.test/ada.png',
      checkedAt: '2024-02-01T08:30:00.000Z',
    });
  });

  it('leaves the checked-by fields null for a subtask nobody has ticked', async () => {
    prismaMock.subtask.findMany.mockResolvedValue([
      {
        id: 'st-open',
        parentSubtaskId: null,
        title: 'Open root',
        isDone: false,
        depth: 0,
        childTotal: 0,
        childDone: 0,
        checkedByNameSnapshot: null,
        checkedByAvatarSnapshot: null,
        checkedAt: null,
      },
    ] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);

    const result = await getTaskDetail('org-1', 'task-1');

    expect(result.subtasks[0]).toMatchObject({
      checkedByName: null,
      checkedByAvatarUrl: null,
      checkedAt: null,
    });
  });

  it('selects the checked-by snapshot columns and the activity actor avatar', async () => {
    prismaMock.subtask.findMany.mockResolvedValue([] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([] as never);

    await getTaskDetail('org-1', 'task-1');

    expect(prismaMock.subtask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          checkedByNameSnapshot: true,
          checkedByAvatarSnapshot: true,
          checkedAt: true,
        }),
      })
    );
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ actorAvatarSnapshot: true }),
      })
    );
  });

  it('flattens assignee names and badges onto the card', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue({
      ...FULL_TASK_ROW,
      assignees: [
        {
          organizationUserId: 'ou-2',
          assignee: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            user: { image: 'https://example.test/ada.png' },
          },
        },
        {
          // No avatar on the linked user, and no surname on the membership.
          organizationUserId: 'ou-3',
          assignee: { firstName: 'Grace', lastName: '', user: { image: null } },
        },
      ],
      badges: [{ badge: { id: 'badge-1', name: 'Urgent', color: '#f00' } }],
    } as never);

    const result = await getTaskDetail('org-1', 'task-1');

    expect(result.assignees).toEqual([
      { organizationUserId: 'ou-2', name: 'Ada Lovelace', avatarUrl: 'https://example.test/ada.png' },
      { organizationUserId: 'ou-3', name: 'Grace', avatarUrl: null },
    ]);
    expect(result.badges).toEqual([{ id: 'badge-1', name: 'Urgent', color: '#f00' }]);
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(getTaskDetail('org-1', 'ghost')).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// listTaskActivity
// ─────────────────────────────────────────────

describe('listTaskActivity', () => {
  it('passes skip/take through and returns the total alongside the page', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        action: 'TASK_UPDATED',
        actorNameSnapshot: 'Actor Name',
        targetTitle: null,
        createdAt: new Date('2024-02-01T00:00:00Z'),
      },
    ] as never);
    prismaMock.taskActivity.count.mockResolvedValue(42);

    const result = await listTaskActivity('org-1', 'task-1', { skip: 20, take: 20 });

    expect(result.total).toBe(42);
    expect(result.items[0].createdAt).toBe('2024-02-01T00:00:00.000Z');
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskItemId: 'task-1', organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      })
    );
  });

  it('exposes the actor avatar snapshot on each row', async () => {
    prismaMock.taskActivity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        action: 'SUBTASK_CHECKED',
        actorNameSnapshot: 'Ada Lovelace',
        actorAvatarSnapshot: 'https://example.test/ada.png',
        targetTitle: 'Write the spec',
        createdAt: new Date('2024-02-01T00:00:00Z'),
      },
      {
        id: 'act-2',
        action: 'TASK_CREATED',
        actorNameSnapshot: 'Grace',
        actorAvatarSnapshot: null,
        targetTitle: null,
        createdAt: new Date('2024-01-31T00:00:00Z'),
      },
    ] as never);
    prismaMock.taskActivity.count.mockResolvedValue(2);

    const result = await listTaskActivity('org-1', 'task-1', { skip: 0, take: 20 });

    expect(result.items[0].actorAvatarUrl).toBe('https://example.test/ada.png');
    expect(result.items[1].actorAvatarUrl).toBeNull();
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(listTaskActivity('org-1', 'ghost', { skip: 0, take: 20 })).rejects.toThrow(
      'Task not found'
    );
  });
});

// ─────────────────────────────────────────────
// setSubtaskDone
// ─────────────────────────────────────────────

describe('setSubtaskDone', () => {
  it('checking a root subtask stamps the checker and bumps TaskItem.subtaskDone', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({
      id: 'st-1',
      depth: 0,
      parentSubtaskId: null,
    } as never);
    prismaMock.subtask.updateMany.mockResolvedValue({ count: 1 } as never);
    mockTransactionPassthrough();

    const result = await setSubtaskDone('org-1', 'task-1', 'st-1', true, ACTOR);

    expect(result.id).toBe('task-1');
    // The conditional guard is what makes two concurrent identical requests safe.
    const updateManyCall = prismaMock.subtask.updateMany.mock.calls[0][0];
    expect(updateManyCall.where).toMatchObject({ id: 'st-1', isDone: { not: true } });
    expect(updateManyCall.data).toMatchObject({
      isDone: true,
      checkedById: ACTOR.organizationUserId,
      checkedByNameSnapshot: ACTOR.name,
    });
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { subtaskDone: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'SUBTASK_CHECKED' }) })
    );
  });

  it('unchecking a nested subtask clears the checker and decrements the parent only', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({
      id: 'st-child',
      depth: 1,
      parentSubtaskId: 'st-root',
    } as never);
    prismaMock.subtask.updateMany.mockResolvedValue({ count: 1 } as never);
    mockTransactionPassthrough();

    await setSubtaskDone('org-1', 'task-1', 'st-child', false, ACTOR);

    expect(prismaMock.subtask.updateMany.mock.calls[0][0].data).toMatchObject({
      isDone: false,
      checkedById: null,
      checkedByNameSnapshot: null,
      checkedAt: null,
    });
    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-root' },
      data: { childDone: { increment: -1 } },
    });
    // depth 1, so the TaskItem's root-only counters stay untouched (I6).
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'SUBTASK_UNCHECKED' }) })
    );
  });

  it('is a no-op when a concurrent request already applied the same state', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({
      id: 'st-1',
      depth: 0,
      parentSubtaskId: null,
    } as never);
    prismaMock.subtask.updateMany.mockResolvedValue({ count: 0 } as never);
    mockTransactionPassthrough();

    await setSubtaskDone('org-1', 'task-1', 'st-1', true, ACTOR);

    // No double-counting, and no duplicate activity row.
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
    expect(prismaMock.taskActivity.create).not.toHaveBeenCalled();
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(setSubtaskDone('org-1', 'ghost', 'st-1', true, ACTOR)).rejects.toThrow(
      'Task not found'
    );
  });

  it('throws "Subtask not found" when the subtask is not on this task', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue(null);

    await expect(setSubtaskDone('org-1', 'task-1', 'ghost', true, ACTOR)).rejects.toThrow(
      'Subtask not found'
    );
  });
});

// ─────────────────────────────────────────────
// addSubtask — nested (parentSubtaskId) branch
// ─────────────────────────────────────────────

describe('addSubtask (nested)', () => {
  it('creates a child at parent.depth + 1 and bumps the parent childTotal', async () => {
    // Two sequential subtask.findFirst calls: the parent lookup, then the
    // last-sibling position lookup.
    prismaMock.subtask.findFirst
      .mockResolvedValueOnce({
        id: 'st-root',
        depth: 0,
        isDone: false,
        parentSubtaskId: null,
      } as never)
      .mockResolvedValueOnce(null as never);
    mockTransactionPassthrough();

    await addSubtask('org-1', 'task-1', 'Child task', ACTOR, 'st-root');

    expect(prismaMock.subtask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentSubtaskId: 'st-root', depth: 1 }),
      })
    );
    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-root' },
      data: { childTotal: { increment: 1 } },
    });
    // Only root subtasks count toward TaskItem.subtaskTotal (I6).
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
  });

  it('un-completes a done parent and un-counts it one level up (I5)', async () => {
    prismaMock.subtask.findFirst
      .mockResolvedValueOnce({
        id: 'st-root',
        depth: 0,
        isDone: true,
        parentSubtaskId: null,
      } as never)
      .mockResolvedValueOnce(null as never);
    mockTransactionPassthrough();

    await addSubtask('org-1', 'task-1', 'Child task', ACTOR, 'st-root');

    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-root' },
      data: expect.objectContaining({
        childTotal: { increment: 1 },
        isDone: false,
        checkedById: null,
        checkedAt: null,
      }),
    });
    // The parent is a root node, so its lost "done" comes off the TaskItem.
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { subtaskDone: { decrement: 1 } },
    });
  });

  it('un-counts a done depth-1 parent against its grandparent, not the TaskItem', async () => {
    prismaMock.subtask.findFirst
      .mockResolvedValueOnce({
        id: 'st-child',
        depth: 1,
        isDone: true,
        parentSubtaskId: 'st-root',
      } as never)
      .mockResolvedValueOnce(null as never);
    mockTransactionPassthrough();

    await addSubtask('org-1', 'task-1', 'Grandchild task', ACTOR, 'st-child');

    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-root' },
      data: { childDone: { decrement: 1 } },
    });
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
  });

  it('throws "Parent subtask not found" when the parent is not on this task', async () => {
    prismaMock.subtask.findFirst.mockResolvedValueOnce(null as never);

    await expect(addSubtask('org-1', 'task-1', 'Child', ACTOR, 'ghost')).rejects.toThrow(
      'Parent subtask not found'
    );
  });

  it('throws "Maximum subtask depth exceeded" for a parent already at depth 2', async () => {
    prismaMock.subtask.findFirst.mockResolvedValueOnce({
      id: 'st-deep',
      depth: 2,
      isDone: false,
      parentSubtaskId: 'st-child',
    } as never);

    await expect(addSubtask('org-1', 'task-1', 'Too deep', ACTOR, 'st-deep')).rejects.toThrow(
      'Maximum subtask depth exceeded'
    );
  });
});

// ─────────────────────────────────────────────
// renameSubtask
// ─────────────────────────────────────────────

describe('renameSubtask', () => {
  it('writes the new title and logs SUBTASK_RENAMED', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({ id: 'st-1', title: 'Old' } as never);
    mockTransactionPassthrough();

    const result = await renameSubtask('org-1', 'task-1', 'st-1', 'New title', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-1' },
      data: { title: 'New title', version: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'SUBTASK_RENAMED', targetTitle: 'New title' }),
      })
    );
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(renameSubtask('org-1', 'ghost', 'st-1', 'x', ACTOR)).rejects.toThrow(
      'Task not found'
    );
  });

  it('throws "Subtask not found" when the subtask is not on this task', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue(null);

    await expect(renameSubtask('org-1', 'task-1', 'ghost', 'x', ACTOR)).rejects.toThrow(
      'Subtask not found'
    );
  });
});

// ─────────────────────────────────────────────
// deleteSubtask
// ─────────────────────────────────────────────

describe('deleteSubtask', () => {
  it('deleting a done root subtask decrements both TaskItem counters', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({
      id: 'st-1',
      title: 'Root subtask',
      isDone: true,
      depth: 0,
      parentSubtaskId: null,
    } as never);
    mockTransactionPassthrough();

    const result = await deleteSubtask('org-1', 'task-1', 'st-1', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { subtaskTotal: { decrement: 1 }, subtaskDone: { decrement: 1 } },
    });
    expect(prismaMock.subtask.delete).toHaveBeenCalledWith({ where: { id: 'st-1' } });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'SUBTASK_DELETED', targetTitle: 'Root subtask' }),
      })
    );
  });

  it('deleting a not-done nested subtask only adjusts the parent childTotal', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue({
      id: 'st-child',
      title: 'Child subtask',
      isDone: false,
      depth: 1,
      parentSubtaskId: 'st-root',
    } as never);
    mockTransactionPassthrough();

    await deleteSubtask('org-1', 'task-1', 'st-child', ACTOR);

    expect(prismaMock.subtask.update).toHaveBeenCalledWith({
      where: { id: 'st-root' },
      data: { childTotal: { decrement: 1 } },
    });
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
  });

  it('throws "Task not found" when the task is missing or trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(deleteSubtask('org-1', 'ghost', 'st-1', ACTOR)).rejects.toThrow('Task not found');
  });

  it('throws "Subtask not found" when the subtask is not on this task', async () => {
    prismaMock.subtask.findFirst.mockResolvedValue(null);

    await expect(deleteSubtask('org-1', 'task-1', 'ghost', ACTOR)).rejects.toThrow(
      'Subtask not found'
    );
  });
});
