// services/board.service.groups.test.ts
// Unit tests for BoardService's column (Group) management: settings patch,
// delete-with-relocation, and reordering. Split out of board.service.test.ts to
// keep both files navigable.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock, mockTransactionPassthrough } from '@/tests/prisma-mock';

import { updateGroup, deleteGroup, reorderGroups, type ActorInput } from './board.service';

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

const GROUP_ROW = {
  id: 'group-1',
  name: 'To Do',
  color: 'slate',
  icon: null,
  wipLimit: null,
  sortOrder: 0,
};

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

/** `$transaction` also takes an array of promises — reorderGroups uses that form. */
function mockTransactionArray() {
  (
    prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }
  ).mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof prismaMock) => unknown)(prismaMock)
  );
}

// ─────────────────────────────────────────────
// updateGroup
// ─────────────────────────────────────────────

describe('updateGroup', () => {
  beforeEach(() => {
    prismaMock.group.findFirst.mockResolvedValue({ id: 'group-1' } as never);
    prismaMock.group.update.mockResolvedValue(GROUP_ROW as never);
  });

  it('renames the column and returns the settings DTO', async () => {
    prismaMock.group.update.mockResolvedValue({ ...GROUP_ROW, name: 'Backlog' } as never);

    const result = await updateGroup('org-1', 'group-1', { name: 'Backlog' });

    expect(result.name).toBe('Backlog');
    expect(prismaMock.group.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'group-1' }, data: { name: 'Backlog' } })
    );
  });

  it('writes only the keys present in the patch', async () => {
    await updateGroup('org-1', 'group-1', { color: 'blue' });

    const { data } = prismaMock.group.update.mock.calls[0][0];
    expect(data).toEqual({ color: 'blue' });
    // An omitted key must never blank a column.
    expect('name' in data).toBe(false);
    expect('wipLimit' in data).toBe(false);
  });

  it('clears the color when null is passed explicitly', async () => {
    await updateGroup('org-1', 'group-1', { color: null });

    expect(prismaMock.group.update.mock.calls[0][0].data).toEqual({ color: null });
  });

  it('clears the wipLimit when null is passed explicitly', async () => {
    await updateGroup('org-1', 'group-1', { wipLimit: null });

    expect(prismaMock.group.update.mock.calls[0][0].data).toEqual({ wipLimit: null });
  });

  it('scopes the lookup to the organization', async () => {
    await updateGroup('org-1', 'group-1', { name: 'Backlog' });

    expect(prismaMock.group.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'group-1', organizationId: 'org-1' } })
    );
  });

  it('throws "Group not found" for a column outside the organization', async () => {
    prismaMock.group.findFirst.mockResolvedValue(null);

    await expect(updateGroup('org-1', 'ghost', { name: 'Backlog' })).rejects.toThrow(
      'Group not found'
    );
    expect(prismaMock.group.update).not.toHaveBeenCalled();
  });

  it('throws "Duplicate entry" when the new name collides', async () => {
    prismaMock.group.update.mockRejectedValue(uniqueConstraintError());

    await expect(updateGroup('org-1', 'group-1', { name: 'Done' })).rejects.toThrow(
      'Duplicate entry'
    );
  });

  it('re-throws non-unique-constraint database errors untouched', async () => {
    prismaMock.group.update.mockRejectedValue(new Error('connection reset'));

    await expect(updateGroup('org-1', 'group-1', { name: 'Done' })).rejects.toThrow(
      'connection reset'
    );
  });

  it('writes no TaskActivity row', async () => {
    await updateGroup('org-1', 'group-1', { name: 'Backlog' });

    expect(prismaMock.taskActivity.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// deleteGroup
// ─────────────────────────────────────────────

describe('deleteGroup', () => {
  beforeEach(() => {
    prismaMock.group.findFirst
      .mockResolvedValueOnce({ id: 'group-1', name: 'To Do' } as never)
      .mockResolvedValueOnce({ id: 'group-2', name: 'Done' } as never);
    prismaMock.group.count.mockResolvedValue(2);
    prismaMock.taskItem.aggregate.mockResolvedValue({
      _max: { position: new Prisma.Decimal(10) },
    } as never);
    prismaMock.taskItem.findMany.mockResolvedValue([] as never);
    mockTransactionPassthrough();
  });

  it('moves every card into the target, appending after its highest position', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      { id: 'task-1', title: 'First' },
      { id: 'task-2', title: 'Second' },
      { id: 'task-3', title: 'Third' },
    ] as never);

    const result = await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    expect(result).toEqual({ id: 'group-1', movedTaskCount: 3 });
    const positions = prismaMock.taskItem.update.mock.calls.map((call) =>
      String(call[0].data.position)
    );
    expect(positions).toEqual(['11', '12', '13']);
    expect(prismaMock.taskItem.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'task-1' },
      data: { groupId: 'group-2' },
    });
    // Relative order is preserved by reading the source ordered by position.
    expect(prismaMock.taskItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { position: 'asc' } })
    );
  });

  it('moves trashed cards too, so the cascade cannot hard-delete them', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([{ id: 'task-trashed', title: 'Trashed' }] as never);

    await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    // No deletedAt filter on either read — trashed rows belong to the column
    // and would be cascade-deleted along with it.
    const listWhere = prismaMock.taskItem.findMany.mock.calls[0][0]?.where;
    expect('deletedAt' in (listWhere ?? {})).toBe(false);
    const aggregateWhere = prismaMock.taskItem.aggregate.mock.calls[0][0].where;
    expect('deletedAt' in (aggregateWhere ?? {})).toBe(false);
    expect(prismaMock.taskItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'task-trashed' } })
    );
  });

  it('writes one TASK_MOVED row per moved card, all sharing one batchId', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([
      { id: 'task-1', title: 'First' },
      { id: 'task-2', title: 'Second' },
    ] as never);

    await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    const rows = prismaMock.taskActivity.create.mock.calls.map((call) => call[0].data);
    // One row per moved card, plus the GROUP_DELETED row for the column itself.
    expect(rows.filter((row) => row.action === 'TASK_MOVED')).toHaveLength(2);
    expect(rows.filter((row) => row.action === 'GROUP_DELETED')).toHaveLength(1);
    // One user action, so the whole set shares a batchId.
    expect(new Set(rows.map((row) => row.batchId)).size).toBe(1);
  });

  it('records the source and target column names in changes', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([{ id: 'task-1', title: 'First' }] as never);

    await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    expect(prismaMock.taskActivity.create.mock.calls[0][0].data.changes).toMatchObject({
      field: 'group',
      before: 'To Do',
      after: 'Done',
      context: { reason: 'group-deleted' },
    });
  });

  it('deletes the group only after every card has moved', async () => {
    prismaMock.taskItem.findMany.mockResolvedValue([{ id: 'task-1', title: 'First' }] as never);

    await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    const movedAt = prismaMock.taskItem.update.mock.invocationCallOrder[0];
    const deletedAt = prismaMock.group.delete.mock.invocationCallOrder[0];
    expect(deletedAt).toBeGreaterThan(movedAt);
    expect(prismaMock.group.delete).toHaveBeenCalledWith({ where: { id: 'group-1' } });
  });

  it('logs only the column removal when there are no cards to move', async () => {
    const result = await deleteGroup('org-1', 'group-1', 'group-2', ACTOR);

    expect(result.movedTaskCount).toBe(0);
    expect(prismaMock.taskActivity.create).toHaveBeenCalledTimes(1);
    const activity = prismaMock.taskActivity.create.mock.calls[0][0].data;
    expect(activity).toMatchObject({ action: 'GROUP_DELETED', targetTitle: 'To Do' });
    // Structural events describe a column, not a card — hence the nullable
    // taskItemId on the model.
    expect('taskItemId' in activity).toBe(false);
    expect(prismaMock.group.delete).toHaveBeenCalled();
  });

  it('throws "Cannot delete the last column" when it is the only column', async () => {
    prismaMock.group.count.mockResolvedValue(1);

    await expect(deleteGroup('org-1', 'group-1', 'group-2', ACTOR)).rejects.toThrow(
      'Cannot delete the last column'
    );
  });

  it('checks the column count before moving anything', async () => {
    prismaMock.group.count.mockResolvedValue(1);
    prismaMock.taskItem.findMany.mockResolvedValue([{ id: 'task-1', title: 'First' }] as never);

    await expect(deleteGroup('org-1', 'group-1', 'group-2', ACTOR)).rejects.toThrow(
      'Cannot delete the last column'
    );
    // A refused delete must never strand cards in a half-moved state.
    expect(prismaMock.taskItem.update).not.toHaveBeenCalled();
    expect(prismaMock.group.delete).not.toHaveBeenCalled();
  });

  it('throws "Group not found" for a column outside the organization', async () => {
    prismaMock.group.findFirst.mockReset();
    prismaMock.group.findFirst.mockResolvedValue(null);

    await expect(deleteGroup('org-1', 'ghost', 'group-2', ACTOR)).rejects.toThrow('Group not found');
  });

  it('throws "Target group not found" for a target outside the organization', async () => {
    prismaMock.group.findFirst.mockReset();
    prismaMock.group.findFirst
      .mockResolvedValueOnce({ id: 'group-1', name: 'To Do' } as never)
      .mockResolvedValueOnce(null);

    await expect(deleteGroup('org-1', 'group-1', 'foreign-group', ACTOR)).rejects.toThrow(
      'Target group not found'
    );
    expect(prismaMock.group.delete).not.toHaveBeenCalled();
  });

  it('throws "Target column must be different" when source and target match', async () => {
    await expect(deleteGroup('org-1', 'group-1', 'group-1', ACTOR)).rejects.toThrow(
      'Target column must be different'
    );
    expect(prismaMock.group.findFirst).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// reorderGroups
// ─────────────────────────────────────────────

describe('reorderGroups', () => {
  beforeEach(() => {
    prismaMock.group.findMany
      .mockResolvedValueOnce([{ id: 'group-1' }, { id: 'group-2' }, { id: 'group-3' }] as never)
      .mockResolvedValueOnce([GROUP_ROW] as never);
    prismaMock.group.update.mockResolvedValue(GROUP_ROW as never);
    mockTransactionArray();
  });

  it('writes sortOrder 0..n-1 in the supplied order', async () => {
    await reorderGroups('org-1', 'plan-1', ['group-3', 'group-1', 'group-2']);

    expect(prismaMock.group.update.mock.calls.map((call) => call[0])).toEqual([
      { where: { id: 'group-3' }, data: { sortOrder: 0 } },
      { where: { id: 'group-1' }, data: { sortOrder: 1 } },
      { where: { id: 'group-2' }, data: { sortOrder: 2 } },
    ]);
  });

  it('renumbers inside a single transaction', async () => {
    await reorderGroups('org-1', 'plan-1', ['group-3', 'group-1', 'group-2']);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('throws when an id is missing from the order', async () => {
    await expect(reorderGroups('org-1', 'plan-1', ['group-1', 'group-2'])).rejects.toThrow(
      'Group order must include every column exactly once'
    );
    expect(prismaMock.group.update).not.toHaveBeenCalled();
  });

  it('throws when an unknown id is included', async () => {
    await expect(reorderGroups('org-1', 'plan-1', ['group-1', 'group-2', 'ghost'])).rejects.toThrow(
      'Group order must include every column exactly once'
    );
  });

  it('throws when an id appears twice', async () => {
    await expect(reorderGroups('org-1', 'plan-1', ['group-1', 'group-1', 'group-2'])).rejects.toThrow(
      'Group order must include every column exactly once'
    );
  });

  it('writes no TaskActivity row', async () => {
    await reorderGroups('org-1', 'plan-1', ['group-3', 'group-1', 'group-2']);

    expect(prismaMock.taskActivity.create).not.toHaveBeenCalled();
  });
});
