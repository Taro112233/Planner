// services/board.service.test.ts
// Unit tests for the newer BoardService mutations (assignTask, unassignTask,
// addSubtask). The older read/move/toggle functions predate this test file
// and are not covered here — see CLAUDE.md's coverage note if extending.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { assignTask, unassignTask, addSubtask, type ActorInput } from './board.service';

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

function mockTransactionPassthrough() {
  (prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(
    (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)
  );
}

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
