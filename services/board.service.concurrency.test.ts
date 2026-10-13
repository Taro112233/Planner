// services/board.service.concurrency.test.ts
// 50 members acting at the same moment, against a simulated connection pool.
//
// The Neon adapter gives Prisma a pool of 10 connections. An interactive
// transaction holds one connection for its whole callback, so any query
// inside it that goes through the global `prisma` instead of `tx` needs a
// second connection while still holding the first. Ten such transactions in
// flight hold every connection and wait on each other until they time out.
//
// The harness below models exactly that: `$transaction` occupies a pool slot
// for its callback (with a timeout, like Prisma's 5 s default), every query on
// the global client occupies a slot for one tick, and queries on `tx` reuse
// the transaction's slot. Prisma itself stays mocked — this checks how the
// service uses connections, not the database.

import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';
import { Prisma, type PrismaClient } from '@prisma/client';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { createTask, setSubtaskDone, type ActorInput } from './board.service';

const POOL_SIZE = 10;
const USERS = 50;
const TX_TIMEOUT_MS = 300;

/** A counting semaphore standing in for the pg connection pool. */
function createPool(size: number) {
  let free = size;
  const waiting: (() => void)[] = [];
  return {
    async run<T>(work: () => Promise<T>): Promise<T> {
      if (free === 0) await new Promise<void>((resolve) => waiting.push(resolve));
      else free -= 1;
      try {
        return await work();
      } finally {
        const next = waiting.shift();
        if (next) next();
        else free += 1;
      }
    },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Transaction timed out')), ms)
    ),
  ]);
}

const actor = (i: number): ActorInput => ({
  organizationUserId: `ou-${i}`,
  userId: `user-${i}`,
  name: `Member ${i}`,
  avatarUrl: null,
  role: 'MEMBER',
});

const PLAN_ROW = { group: { planId: 'plan-1', plan: { name: 'แผนงานหลัก' } } };

let tx: DeepMockProxy<PrismaClient>;

/** Route every global query and every transaction through one shared pool. */
function installPool() {
  const pool = createPool(POOL_SIZE);
  const viaPool =
    <T>(value: T) =>
    () =>
      pool.run(async () => {
        await tick();
        return value;
      });

  tx = mockDeep<PrismaClient>();
  (prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(
    (callback: (client: typeof tx) => Promise<unknown>) =>
      pool.run(() => withTimeout(callback(tx), TX_TIMEOUT_MS))
  );
  return viaPool;
}

describe('50 members at once, 10 pooled connections', () => {
  beforeEach(() => {
    const viaPool = installPool();

    // Global-client reads (outside any transaction) take a slot each.
    prismaMock.group.findFirst.mockImplementation(viaPool({ id: 'g-1' }) as never);
    prismaMock.subtask.findFirst.mockImplementation(
      viaPool({ id: 's-1', depth: 0, parentSubtaskId: null }) as never
    );
    // Used both for the pre-checks and, if a service leaks it into a
    // transaction, for the plan snapshot — which is what must not happen.
    prismaMock.taskItem.findFirst.mockImplementation(
      viaPool({ id: 't-1', title: 'Card', position: new Prisma.Decimal(1), ...PLAN_ROW }) as never
    );
    prismaMock.plan.findUnique.mockImplementation(viaPool({ name: 'แผนงานหลัก' }) as never);

    // Inside the transaction everything goes through `tx`, on its own slot.
    tx.taskItem.create.mockImplementation((async (args: { data: { title: string } }) => ({
      id: `t-${args.data.title}`,
      groupId: 'g-1',
      title: args.data.title,
      status: 'TODO',
      priority: 'MEDIUM',
      position: new Prisma.Decimal(2),
      startDate: null,
      dueDate: null,
      subtaskTotal: 0,
      subtaskDone: 0,
      assignees: [],
      badges: [],
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as never);
    tx.taskItem.findFirst.mockResolvedValue(PLAN_ROW as never);
    tx.taskItem.update.mockResolvedValue({} as never);
    tx.subtask.updateMany.mockResolvedValue({ count: 1 });
    tx.taskActivity.create.mockResolvedValue({} as never);
  });

  it('creates 50 cards concurrently without exhausting the pool', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: USERS }, (_, i) => createTask('org-1', 'g-1', `card-${i}`, actor(i)))
    );

    const failed = results.filter((result) => result.status === 'rejected');
    expect(failed).toHaveLength(0);
    expect(tx.taskItem.create).toHaveBeenCalledTimes(USERS);
  });

  it('records the plan on every TASK_CREATED, read inside the transaction', async () => {
    await Promise.all(
      Array.from({ length: USERS }, (_, i) => createTask('org-1', 'g-1', `card-${i}`, actor(i)))
    );

    // The global client cannot see an uncommitted card; the snapshot must
    // come from `tx`, or planId ends up null.
    for (const [args] of tx.taskActivity.create.mock.calls) {
      expect(args.data).toMatchObject({ planId: 'plan-1', planNameSnapshot: 'แผนงานหลัก' });
    }
    expect(tx.taskActivity.create).toHaveBeenCalledTimes(USERS);
  });

  it('ticks a subtask 50 times concurrently: no timeouts, counters applied once per flip', async () => {
    // Only the first request actually flips the row; the rest find nothing to
    // change and must not touch the counters.
    let flipped = false;
    tx.subtask.updateMany.mockImplementation((async () => {
      if (flipped) return { count: 0 };
      flipped = true;
      return { count: 1 };
    }) as never);
    // setSubtaskDone ends by re-reading the task; let that fail fast, the
    // concurrency behaviour is what is under test.
    prismaMock.taskItem.findUnique.mockResolvedValue(null);

    const results = await Promise.allSettled(
      Array.from({ length: USERS }, (_, i) => setSubtaskDone('org-1', 't-1', 's-1', true, actor(i)))
    );

    const timedOut = results.filter(
      (result) => result.status === 'rejected' && String(result.reason).includes('timed out')
    );
    expect(timedOut).toHaveLength(0);
    expect(tx.taskItem.update).toHaveBeenCalledTimes(1);
    expect(tx.taskActivity.create).toHaveBeenCalledTimes(1);
  });
});
