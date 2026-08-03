// services/task.service.test.ts
// Unit tests for task.service — toggleSubtask + findAndToggleSubtask.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect } from 'vitest';
import type { Prisma } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { toggleSubtask, findAndToggleSubtask } from './task.service';
import type { SubtaskProps } from '@/types/planner';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const ORG_ID  = 'org-111';
const USER_ID = 'user-999';

/** Flat subtask list for simple tests */
const FLAT_SUBTASKS: SubtaskProps[] = [
  { id: 'sub-1', title: 'Write unit tests', isCompleted: false },
  { id: 'sub-2', title: 'Write integration tests', isCompleted: true },
];

/** 3-level nested subtask tree */
const NESTED_SUBTASKS: SubtaskProps[] = [
  {
    id: 'sub-A',
    title: 'Level 1',
    isCompleted: false,
    children: [
      {
        id: 'sub-B',
        title: 'Level 2',
        isCompleted: false,
        children: [
          { id: 'sub-C', title: 'Level 3 (deep target)', isCompleted: false },
        ],
      },
    ],
  },
];

function makeTask(subtasks: SubtaskProps[] = FLAT_SUBTASKS) {
  return {
    id:             'task-001',
    organizationId: ORG_ID,
    groupId:        'group-abc',
    title:          'Test Task',
    description:    null,
    status:         'TODO' as const,
    priority:       'MEDIUM' as const,
    subtasks:       subtasks as unknown as Prisma.JsonValue,
    planDetails:    null,
    dueDate:        null,
    assigneeId:     null,
    createdById:    USER_ID,
    createdAt:      new Date('2024-01-01T00:00:00Z'),
    updatedAt:      new Date('2024-01-02T00:00:00Z'),
  };
}

// ─────────────────────────────────────────────
// findAndToggleSubtask — pure unit tests (no DB)
// ─────────────────────────────────────────────

describe('findAndToggleSubtask', () => {
  it('toggles isCompleted from false to true for a flat subtask', () => {
    const result = findAndToggleSubtask(FLAT_SUBTASKS, 'sub-1');

    expect(result).not.toBeNull();
    expect(result![0].isCompleted).toBe(true);  // sub-1 toggled
    expect(result![1].isCompleted).toBe(true);  // sub-2 unchanged
  });

  it('toggles isCompleted from true to false for a flat subtask', () => {
    const result = findAndToggleSubtask(FLAT_SUBTASKS, 'sub-2');

    expect(result).not.toBeNull();
    expect(result![0].isCompleted).toBe(false); // sub-1 unchanged
    expect(result![1].isCompleted).toBe(false); // sub-2 toggled
  });

  it('returns null when the subtaskId does not exist in the tree', () => {
    const result = findAndToggleSubtask(FLAT_SUBTASKS, 'non-existent-id');

    expect(result).toBeNull();
  });

  it('toggles a deeply nested subtask (level 3)', () => {
    const result = findAndToggleSubtask(NESTED_SUBTASKS, 'sub-C');

    expect(result).not.toBeNull();
    // Level 1 node untouched at top level
    expect(result![0].isCompleted).toBe(false);
    // Level 2 node untouched
    expect(result![0].children![0].isCompleted).toBe(false);
    // Level 3 target — toggled
    expect(result![0].children![0].children![0].isCompleted).toBe(true);
  });

  it('does not mutate the original input array', () => {
    const original = structuredClone(FLAT_SUBTASKS);
    findAndToggleSubtask(FLAT_SUBTASKS, 'sub-1');

    expect(FLAT_SUBTASKS[0].isCompleted).toEqual(original[0].isCompleted);
    expect(FLAT_SUBTASKS[1].isCompleted).toEqual(original[1].isCompleted);
  });
});

// ─────────────────────────────────────────────
// toggleSubtask — service integration (Prisma mocked)
// ─────────────────────────────────────────────

describe('toggleSubtask', () => {
  // ── Happy paths ──

  it('toggles a subtask from false → true and persists the change', async () => {
    const task = makeTask(FLAT_SUBTASKS);

    prismaMock.task.findFirst.mockResolvedValue(task);
    const updatedSubtasks: SubtaskProps[] = [
      { id: 'sub-1', title: 'Write unit tests', isCompleted: true },
      { id: 'sub-2', title: 'Write integration tests', isCompleted: true },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.$transaction.mockResolvedValue([
      { ...task, subtasks: updatedSubtasks as unknown as Prisma.JsonValue, updatedAt: new Date() },
      { id: 'audit-1' },
    ] as any);


    const result = await toggleSubtask('task-001', 'sub-1', USER_ID, ORG_ID);

    expect(result.subtasks[0].isCompleted).toBe(true);
    expect(result.subtasks[1].isCompleted).toBe(true);
    expect(prismaMock.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-001', organizationId: ORG_ID },
      })
    );
  });

  it('toggles a subtask from true → false and persists the change', async () => {
    const task = makeTask(FLAT_SUBTASKS);

    prismaMock.task.findFirst.mockResolvedValue(task);
    const updatedSubtasks2: SubtaskProps[] = [
      { id: 'sub-1', title: 'Write unit tests', isCompleted: false },
      { id: 'sub-2', title: 'Write integration tests', isCompleted: false },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.$transaction.mockResolvedValue([
      { ...task, subtasks: updatedSubtasks2 as unknown as Prisma.JsonValue, updatedAt: new Date() },
      { id: 'audit-2' },
    ] as any);

    const result = await toggleSubtask('task-001', 'sub-2', USER_ID, ORG_ID);

    expect(result.subtasks[1].isCompleted).toBe(false);
  });

  it('passes the correct organizationId scope to task.findFirst', async () => {
    const task = makeTask();
    prismaMock.task.findFirst.mockResolvedValue(task);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.$transaction.mockResolvedValue([
      { ...task, updatedAt: new Date() },
      { id: 'audit-3' },
    ] as any);

    await toggleSubtask('task-001', 'sub-1', USER_ID, ORG_ID);

    // Must ALWAYS scope by organizationId — multi-tenant isolation rule
    expect(prismaMock.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: ORG_ID }),
      })
    );
  });

  // ── Error cases ──

  it('throws "Task not found" when the task does not exist in this org', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(
      toggleSubtask('ghost-task', 'sub-1', USER_ID, ORG_ID)
    ).rejects.toThrow('Task not found');

    // Transaction must NOT be called — no write should happen
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('throws "Subtask not found" when the subtaskId is not in the tree', async () => {
    const task = makeTask(FLAT_SUBTASKS);
    prismaMock.task.findFirst.mockResolvedValue(task);

    await expect(
      toggleSubtask('task-001', 'non-existent-sub', USER_ID, ORG_ID)
    ).rejects.toThrow('Subtask not found');

    // Transaction must NOT be called — no write should happen
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
