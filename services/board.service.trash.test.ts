// services/board.service.trash.test.ts
// Unit tests for BoardService's trash lifecycle: soft delete, restore,
// permanent purge and the trash listing. Split out of board.service.test.ts to
// keep both files navigable.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock, mockTransactionPassthrough } from '@/tests/prisma-mock';

import {
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
  listTrashedTasks,
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
// deleteTask (soft delete)
// ─────────────────────────────────────────────

describe('deleteTask', () => {
  it('stamps deletedAt/deletedById and logs TASK_DELETED', async () => {
    mockTransactionPassthrough();

    const result = await deleteTask('org-1', 'task-1', ACTOR);

    expect(result).toEqual({ id: 'task-1' });

    const updateCall = prismaMock.taskItem.update.mock.calls[0][0];
    const data = updateCall.data as { deletedAt: Date; deletedById: string };
    expect(data.deletedAt).toBeInstanceOf(Date);
    expect(data.deletedById).toBe(ACTOR.organizationUserId);
    expect(updateCall.data).toMatchObject({ version: { increment: 1 } });

    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TASK_DELETED',
          taskItemTitleSnapshot: 'Design homepage',
        }),
      })
    );
  });

  it('only targets tasks that are not already trashed', async () => {
    mockTransactionPassthrough();

    await deleteTask('org-1', 'task-1', ACTOR);

    expect(prismaMock.taskItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1', organizationId: 'org-1', deletedAt: null },
      })
    );
  });

  it('throws "Task not found" when missing, or already in the trash', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(deleteTask('org-1', 'ghost', ACTOR)).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// restoreTask
// ─────────────────────────────────────────────

describe('restoreTask', () => {
  it('clears the trash fields, logs TASK_RESTORED and returns the task detail', async () => {
    mockTransactionPassthrough();

    const result = await restoreTask('org-1', 'task-1', ACTOR);

    expect(result.id).toBe('task-1');
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { deletedAt: null, deletedById: null, version: { increment: 1 } },
    });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TASK_RESTORED' }) })
    );
  });

  it('only targets tasks that are currently trashed', async () => {
    mockTransactionPassthrough();

    await restoreTask('org-1', 'task-1', ACTOR);

    expect(prismaMock.taskItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1', organizationId: 'org-1', deletedAt: { not: null } },
      })
    );
  });

  it('throws "Task not found" when missing, or not currently trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(restoreTask('org-1', 'task-1', ACTOR)).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// permanentlyDeleteTask
// ─────────────────────────────────────────────

describe('permanentlyDeleteTask', () => {
  it('writes the TASK_PURGED activity before deleting the row', async () => {
    mockTransactionPassthrough();

    const result = await permanentlyDeleteTask('org-1', 'task-1', ACTOR);

    expect(result).toEqual({ id: 'task-1' });
    expect(prismaMock.taskActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TASK_PURGED',
          taskItemTitleSnapshot: 'Design homepage',
        }),
      })
    );
    expect(prismaMock.taskItem.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });

    // Order matters: history is written first so it survives the row going
    // away (TaskActivity has no FK to TaskItem by design).
    const activityOrder = prismaMock.taskActivity.create.mock.invocationCallOrder[0];
    const deleteOrder = prismaMock.taskItem.delete.mock.invocationCallOrder[0];
    expect(activityOrder).toBeLessThan(deleteOrder);
  });

  it('only targets tasks that are currently trashed', async () => {
    mockTransactionPassthrough();

    await permanentlyDeleteTask('org-1', 'task-1', ACTOR);

    expect(prismaMock.taskItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1', organizationId: 'org-1', deletedAt: { not: null } },
      })
    );
  });

  it('throws "Task not found" when missing, or not currently trashed', async () => {
    prismaMock.taskItem.findFirst.mockResolvedValue(null);

    await expect(permanentlyDeleteTask('org-1', 'task-1', ACTOR)).rejects.toThrow('Task not found');
  });
});

// ─────────────────────────────────────────────
// listTrashedTasks
// ─────────────────────────────────────────────

describe('listTrashedTasks', () => {
  it('lists trashed tasks most recently deleted first, flattening the relations', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Design homepage',
        priority: 'MEDIUM',
        deletedAt: new Date('2024-05-01T00:00:00Z'),
        group: { name: 'Todo' },
        deletedBy: { firstName: 'Ada', lastName: 'Lovelace' },
      },
    ] as never);

    const result = await listTrashedTasks('org-1');

    expect(result).toEqual([
      {
        id: 'task-1',
        title: 'Design homepage',
        priority: 'MEDIUM',
        groupName: 'Todo',
        deletedAt: '2024-05-01T00:00:00.000Z',
        deletedByName: 'Ada Lovelace',
      },
    ]);
    expect(prismaMock.taskItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      })
    );
  });

  it('falls back to "Unknown" when the deleting member has left the organization', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      {
        id: 'task-2',
        title: 'Orphaned card',
        priority: 'LOW',
        deletedAt: new Date('2024-05-02T00:00:00Z'),
        group: { name: 'Done' },
        deletedBy: null,
      },
    ] as never);

    const result = await listTrashedTasks('org-1');

    expect(result[0].deletedByName).toBe('Unknown');
  });
});
