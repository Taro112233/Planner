// services/plan.service.test.ts
// Unit tests for PlanService: default-plan provisioning (including adopting
// columns from organizations that predate Plan), plan CRUD with counters, and
// plan-group CRUD.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, beforeEach } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock, mockTransactionPassthrough } from '@/tests/prisma-mock';

import {
  getOrCreateDefaultPlan,
  getPlan,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listPlanGroups,
  createPlanGroup,
  updatePlanGroup,
  deletePlanGroup,
  regenerateJoinCode,
  setJoinCodeEnabled,
  joinPlanGroupByCode,
  normalizeJoinCode,
  DEFAULT_PLAN_NAME,
} from './plan.service';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const PLAN_ROW = {
  id: 'plan-1',
  organizationId: 'org-1',
  planGroupId: null,
  name: 'แผนงานหลัก',
  color: null,
  icon: null,
  sortOrder: 0,
};

const PLAN_GROUP_ROW = {
  id: 'pg-1',
  name: 'การตลาด Q3',
  description: null,
  color: 'blue',
  icon: null,
  sortOrder: 0,
};

function uniqueConstraintError() {
  return Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
}

// ─────────────────────────────────────────────
// getOrCreateDefaultPlan
// ─────────────────────────────────────────────

describe('getOrCreateDefaultPlan', () => {
  it('returns the existing plan and adopts any columns still missing one', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(PLAN_ROW as never);
    prismaMock.group.updateMany.mockResolvedValue({ count: 3 } as never);

    const result = await getOrCreateDefaultPlan('org-1');

    expect(result.id).toBe('plan-1');
    expect(prismaMock.plan.create).not.toHaveBeenCalled();
    // Columns created before Plan existed dangle with planId null.
    expect(prismaMock.group.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planId: null },
      data: { planId: 'plan-1' },
    });
  });

  it('ignores soft-deleted plans when resolving the default', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(PLAN_ROW as never);
    prismaMock.group.updateMany.mockResolvedValue({ count: 0 } as never);

    await getOrCreateDefaultPlan('org-1');

    expect(prismaMock.plan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1', deletedAt: null } })
    );
  });

  it('provisions a plan and adopts orphan columns when the org has none', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(null);
    prismaMock.plan.create.mockResolvedValue(PLAN_ROW as never);
    prismaMock.group.updateMany.mockResolvedValue({ count: 3 } as never);
    mockTransactionPassthrough();

    const result = await getOrCreateDefaultPlan('org-1');

    expect(result.id).toBe('plan-1');
    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { organizationId: 'org-1', name: DEFAULT_PLAN_NAME, sortOrder: 0 },
      })
    );
    expect(prismaMock.group.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planId: null },
      data: { planId: 'plan-1' },
    });
  });
});

// ─────────────────────────────────────────────
// getPlan
// ─────────────────────────────────────────────

describe('getPlan', () => {
  it('returns the plan when it exists in the organization', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(PLAN_ROW as never);

    await expect(getPlan('org-1', 'plan-1')).resolves.toMatchObject({ id: 'plan-1' });
  });

  it('throws "Plan not found" for a plan outside the organization', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(null);

    await expect(getPlan('org-1', 'ghost')).rejects.toThrow('Plan not found');
  });
});

// ─────────────────────────────────────────────
// listPlans
// ─────────────────────────────────────────────

describe('listPlans', () => {
  it('computes card totals and completion from the column breakdown', async () => {
    prismaMock.plan.findMany.mockResolvedValue([
      {
        ...PLAN_ROW,
        groups: [
          { id: 'g1', name: 'To Do', color: 'slate', _count: { taskItems: 5 } },
          { id: 'g2', name: 'In Progress', color: 'blue', _count: { taskItems: 3 } },
          { id: 'g3', name: 'Done', color: 'green', _count: { taskItems: 2 } },
        ],
      },
    ] as never);

    const [plan] = await listPlans('org-1');

    expect(plan.taskCount).toBe(10);
    // "Done" is the last column — status is column membership on this board.
    expect(plan.doneCount).toBe(2);
    expect(plan.completionPct).toBe(20);
    expect(plan.columns).toHaveLength(3);
    expect(plan.columns[0]).toEqual({
      id: 'g1',
      name: 'To Do',
      color: 'slate',
      taskCount: 5,
    });
  });

  it('reports 0% rather than dividing by zero for an empty plan', async () => {
    prismaMock.plan.findMany.mockResolvedValue([{ ...PLAN_ROW, groups: [] }] as never);

    const [plan] = await listPlans('org-1');

    expect(plan.taskCount).toBe(0);
    expect(plan.completionPct).toBe(0);
  });

  it('filters by plan group only when one is supplied', async () => {
    prismaMock.plan.findMany.mockResolvedValue([] as never);

    await listPlans('org-1');
    expect(prismaMock.plan.findMany.mock.calls[0][0]?.where).toEqual({
      organizationId: 'org-1',
      deletedAt: null,
    });

    await listPlans('org-1', 'pg-1');
    expect(prismaMock.plan.findMany.mock.calls[1][0]?.where).toEqual({
      organizationId: 'org-1',
      deletedAt: null,
      planGroupId: 'pg-1',
    });

    // Explicit null means "plans not in any group", which is a real filter.
    await listPlans('org-1', null);
    expect(prismaMock.plan.findMany.mock.calls[2][0]?.where).toEqual({
      organizationId: 'org-1',
      deletedAt: null,
      planGroupId: null,
    });
  });
});

// ─────────────────────────────────────────────
// createPlan
// ─────────────────────────────────────────────

describe('createPlan', () => {
  beforeEach(() => {
    prismaMock.plan.findFirst.mockResolvedValue({ sortOrder: 2 } as never);
    prismaMock.plan.create.mockResolvedValue(PLAN_ROW as never);
    prismaMock.group.createMany.mockResolvedValue({ count: 3 } as never);
    mockTransactionPassthrough();
  });

  it('appends after the last plan and seeds the three starter columns', async () => {
    const result = await createPlan('org-1', 'สปรินต์ 12');

    expect(result.id).toBe('plan-1');
    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 3 }) })
    );
    expect(prismaMock.group.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'To Do', planId: 'plan-1' }),
          expect.objectContaining({ name: 'Done', planId: 'plan-1' }),
        ]),
      })
    );
  });

  it('starts at sortOrder 0 for the first plan', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(null);

    await createPlan('org-1', 'แผนแรก');

    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 0 }) })
    );
  });

  it('throws "Plan group not found" for a group outside the organization', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);

    await expect(createPlan('org-1', 'สปรินต์', { planGroupId: 'foreign' })).rejects.toThrow(
      'Plan group not found'
    );
    expect(prismaMock.plan.create).not.toHaveBeenCalled();
  });

  it('throws "Duplicate entry" when the name collides', async () => {
    prismaMock.plan.create.mockRejectedValue(uniqueConstraintError());

    await expect(createPlan('org-1', 'ซ้ำ')).rejects.toThrow('Duplicate entry');
  });
});

// ─────────────────────────────────────────────
// updatePlan
// ─────────────────────────────────────────────

describe('updatePlan', () => {
  beforeEach(() => {
    prismaMock.plan.findFirst.mockResolvedValue({ id: 'plan-1' } as never);
    prismaMock.planGroup.findFirst.mockResolvedValue({ id: 'pg-1' } as never);
    prismaMock.plan.update.mockResolvedValue(PLAN_ROW as never);
  });

  it('writes only the keys present in the patch', async () => {
    await updatePlan('org-1', 'plan-1', { name: 'ชื่อใหม่' });

    expect(prismaMock.plan.update.mock.calls[0][0].data).toEqual({ name: 'ชื่อใหม่' });
  });

  it('connects the plan to a group', async () => {
    await updatePlan('org-1', 'plan-1', { planGroupId: 'pg-1' });

    expect(prismaMock.plan.update.mock.calls[0][0].data).toEqual({
      planGroup: { connect: { id_organizationId: { id: 'pg-1', organizationId: 'org-1' } } },
    });
  });

  it('detaches the plan when planGroupId is null', async () => {
    await updatePlan('org-1', 'plan-1', { planGroupId: null });

    expect(prismaMock.plan.update.mock.calls[0][0].data).toEqual({
      planGroup: { disconnect: true },
    });
  });

  it('throws "Plan not found" for a plan outside the organization', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(null);

    await expect(updatePlan('org-1', 'ghost', { name: 'x' })).rejects.toThrow('Plan not found');
    expect(prismaMock.plan.update).not.toHaveBeenCalled();
  });

  it('throws "Plan group not found" for a foreign target group', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);

    await expect(updatePlan('org-1', 'plan-1', { planGroupId: 'foreign' })).rejects.toThrow(
      'Plan group not found'
    );
  });

  it('throws "Duplicate entry" when the new name collides', async () => {
    prismaMock.plan.update.mockRejectedValue(uniqueConstraintError());

    await expect(updatePlan('org-1', 'plan-1', { name: 'ซ้ำ' })).rejects.toThrow('Duplicate entry');
  });
});

// ─────────────────────────────────────────────
// deletePlan
// ─────────────────────────────────────────────

describe('deletePlan', () => {
  beforeEach(() => {
    prismaMock.plan.findFirst.mockResolvedValue({ id: 'plan-1', name: 'แผนงานหลัก' } as never);
    prismaMock.plan.count.mockResolvedValue(2);
    prismaMock.plan.update.mockResolvedValue(PLAN_ROW as never);
    mockTransactionPassthrough();
  });

  it('soft-deletes without touching the columns or cards inside', async () => {
    const result = await deletePlan('org-1', 'plan-1');

    expect(result).toEqual({ id: 'plan-1' });
    expect(prismaMock.plan.update.mock.calls[0][0].data).toMatchObject({
      deletedAt: expect.any(Date),
    });
    expect(prismaMock.group.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.taskItem.updateMany).not.toHaveBeenCalled();
  });

  it('throws "Cannot delete the last plan"', async () => {
    prismaMock.plan.count.mockResolvedValue(1);

    await expect(deletePlan('org-1', 'plan-1')).rejects.toThrow('Cannot delete the last plan');
    expect(prismaMock.plan.update).not.toHaveBeenCalled();
  });

  it('throws "Plan not found" for a plan outside the organization', async () => {
    prismaMock.plan.findFirst.mockResolvedValue(null);

    await expect(deletePlan('org-1', 'ghost')).rejects.toThrow('Plan not found');
  });
});

// ─────────────────────────────────────────────
// Plan groups
// ─────────────────────────────────────────────

describe('listPlanGroups', () => {
  it('flattens the plan count used by the sidebar badge', async () => {
    prismaMock.planGroup.findMany.mockResolvedValue([
      { ...PLAN_GROUP_ROW, _count: { plans: 4 } },
    ] as never);

    const [group] = await listPlanGroups('org-1');

    expect(group).toEqual({ ...PLAN_GROUP_ROW, planCount: 4 });
  });
});

describe('createPlanGroup', () => {
  beforeEach(() => {
    prismaMock.planGroup.findFirst.mockResolvedValue({ sortOrder: 1 } as never);
    prismaMock.planGroup.create.mockResolvedValue(PLAN_GROUP_ROW as never);
    mockTransactionPassthrough();
  });

  it('appends after the last group and starts with no plans', async () => {
    const result = await createPlanGroup('org-1', 'การตลาด Q3', 'blue');

    expect(result.planCount).toBe(0);
    expect(prismaMock.planGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 2 }) })
    );
  });

  it('records the creator as owner and first member', async () => {
    await createPlanGroup('org-1', 'การตลาด Q3', 'blue', 'ou-owner');

    expect(prismaMock.planGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: 'ou-owner' }) })
    );
    expect(prismaMock.planGroupMember.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        planGroupId: 'pg-1',
        organizationUserId: 'ou-owner',
        role: 'OWNER',
      },
    });
  });

  it('creates no membership row when no owner is supplied', async () => {
    await createPlanGroup('org-1', 'การตลาด Q3', null);

    expect(prismaMock.planGroupMember.create).not.toHaveBeenCalled();
  });

  it('throws "Duplicate entry" when the name collides', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);
    prismaMock.planGroup.create.mockRejectedValue(uniqueConstraintError());

    await expect(createPlanGroup('org-1', 'ซ้ำ', null)).rejects.toThrow('Duplicate entry');
  });
});

describe('updatePlanGroup', () => {
  it('writes only the keys present in the patch', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue({ id: 'pg-1' } as never);
    prismaMock.planGroup.update.mockResolvedValue({
      ...PLAN_GROUP_ROW,
      _count: { plans: 2 },
    } as never);

    const result = await updatePlanGroup('org-1', 'pg-1', { color: 'pink' });

    expect(prismaMock.planGroup.update.mock.calls[0][0].data).toEqual({ color: 'pink' });
    expect(result.planCount).toBe(2);
  });

  it('throws "Plan group not found" for a group outside the organization', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);

    await expect(updatePlanGroup('org-1', 'ghost', { name: 'x' })).rejects.toThrow(
      'Plan group not found'
    );
  });
});

describe('deletePlanGroup', () => {
  beforeEach(() => {
    prismaMock.planGroup.findFirst.mockResolvedValue({ id: 'pg-1' } as never);
    prismaMock.plan.updateMany.mockResolvedValue({ count: 3 } as never);
    mockTransactionPassthrough();
  });

  it('detaches its plans before deleting, so the work survives', async () => {
    const result = await deletePlanGroup('org-1', 'pg-1');

    expect(result).toEqual({ id: 'pg-1', detachedPlanCount: 3 });
    expect(prismaMock.plan.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', planGroupId: 'pg-1' },
      data: { planGroupId: null },
    });
    // The FK is Restrict — deleting first would simply fail.
    const detachedAt = prismaMock.plan.updateMany.mock.invocationCallOrder[0];
    const deletedAt = prismaMock.planGroup.delete.mock.invocationCallOrder[0];
    expect(deletedAt).toBeGreaterThan(detachedAt);
  });

  it('throws "Plan group not found" for a group outside the organization', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);

    await expect(deletePlanGroup('org-1', 'ghost')).rejects.toThrow('Plan group not found');
    expect(prismaMock.planGroup.delete).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// Join codes
// ─────────────────────────────────────────────

describe('normalizeJoinCode', () => {
  it('accepts any case, spacing and punctuation the user types', () => {
    expect(normalizeJoinCode('k3f8qpmr')).toBe('K3F8-QPMR');
    expect(normalizeJoinCode('  K3F8-QPMR ')).toBe('K3F8-QPMR');
    expect(normalizeJoinCode('k3f8 qpmr')).toBe('K3F8-QPMR');
  });

  it('leaves a wrong-length code unformatted so the lookup simply misses', () => {
    expect(normalizeJoinCode('abc')).toBe('ABC');
  });

  it('pulls the code out of a pasted invite link', () => {
    expect(normalizeJoinCode('https://planner.app/join/K3F8-QPMR')).toBe('K3F8-QPMR');
    expect(normalizeJoinCode('https://planner.app/join/k3f8qpmr?from=chat')).toBe('K3F8-QPMR');
    expect(normalizeJoinCode('https://planner.app/join/K3F8-QPMR/')).toBe('K3F8-QPMR');
  });
});

describe('regenerateJoinCode', () => {
  beforeEach(() => {
    prismaMock.planGroup.findFirst.mockResolvedValue({
      id: 'pg-1',
      ownerId: 'ou-owner',
      joinCode: null,
    } as never);
    prismaMock.planGroup.update.mockResolvedValue({
      id: 'pg-1',
      joinCode: 'K3F8-QPMR',
      joinCodeEnabled: true,
    } as never);
  });

  it('issues a grouped code and opens joining in one step', async () => {
    const result = await regenerateJoinCode('org-1', 'pg-1', 'ou-owner');

    expect(result.joinCodeEnabled).toBe(true);
    const { data } = prismaMock.planGroup.update.mock.calls[0][0];
    expect(data.joinCodeEnabled).toBe(true);
    expect(String(data.joinCode)).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('never issues a code containing look-alike characters', async () => {
    await regenerateJoinCode('org-1', 'pg-1', 'ou-owner');

    const code = String(prismaMock.planGroup.update.mock.calls[0][0].data.joinCode);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it('refuses a member who is not the owner', async () => {
    await expect(regenerateJoinCode('org-1', 'pg-1', 'ou-other')).rejects.toThrow(
      'Only the group owner can manage the join code'
    );
    expect(prismaMock.planGroup.update).not.toHaveBeenCalled();
  });

  it('lets a member claim an ownerless group rather than locking everyone out', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue({
      id: 'pg-1',
      ownerId: null,
      joinCode: null,
    } as never);

    await regenerateJoinCode('org-1', 'pg-1', 'ou-claimer');

    expect(prismaMock.planGroup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ownerId: 'ou-claimer' } })
    );
  });

  it('throws "Plan group not found" for a group outside the organization', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue(null);

    await expect(regenerateJoinCode('org-1', 'ghost', 'ou-owner')).rejects.toThrow(
      'Plan group not found'
    );
  });
});

describe('setJoinCodeEnabled', () => {
  it('closes joining without discarding the code', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue({
      id: 'pg-1',
      ownerId: 'ou-owner',
      joinCode: 'K3F8-QPMR',
    } as never);
    prismaMock.planGroup.update.mockResolvedValue({
      id: 'pg-1',
      joinCode: 'K3F8-QPMR',
      joinCodeEnabled: false,
    } as never);

    const result = await setJoinCodeEnabled('org-1', 'pg-1', 'ou-owner', false);

    expect(result.joinCode).toBe('K3F8-QPMR');
    expect(prismaMock.planGroup.update.mock.calls[0][0].data).toEqual({
      joinCodeEnabled: false,
    });
  });

  it('refuses to open a group that has no code yet', async () => {
    prismaMock.planGroup.findFirst.mockResolvedValue({
      id: 'pg-1',
      ownerId: 'ou-owner',
      joinCode: null,
    } as never);

    await expect(setJoinCodeEnabled('org-1', 'pg-1', 'ou-owner', true)).rejects.toThrow(
      'Generate a join code first'
    );
  });
});

describe('joinPlanGroupByCode', () => {
  const GROUP = {
    id: 'pg-1',
    name: 'การตลาด Q3',
    organizationId: 'org-owner',
    joinCodeEnabled: true,
  };

  beforeEach(() => {
    prismaMock.planGroup.findUnique.mockResolvedValue(GROUP as never);
    prismaMock.organizationUser.findFirst.mockResolvedValue(null);
    prismaMock.organizationUser.create.mockResolvedValue({
      id: 'ou-joiner',
      status: 'ACTIVE',
    } as never);
    prismaMock.planGroupMember.findFirst.mockResolvedValue(null);
    mockTransactionPassthrough();
  });

  it("adds the joiner to the owner's organization, then to the group", async () => {
    const result = await joinPlanGroupByCode('user-2', 'Ada Lovelace', 'k3f8qpmr');

    expect(result).toEqual({
      planGroupId: 'pg-1',
      planGroupName: 'การตลาด Q3',
      organizationId: 'org-owner',
      alreadyMember: false,
    });
    // The workspace is the tenant boundary — without membership there they
    // could not read a single card.
    expect(prismaMock.organizationUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-owner',
          userId: 'user-2',
          role: 'MEMBER',
        }),
      })
    );
    expect(prismaMock.planGroupMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planGroupId: 'pg-1', role: 'MEMBER' }),
      })
    );
  });

  it('looks the group up by the normalized code', async () => {
    await joinPlanGroupByCode('user-2', 'Ada', 'k3f8 qpmr');

    expect(prismaMock.planGroup.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { joinCode: 'K3F8-QPMR' } })
    );
  });

  it('reuses an existing membership instead of duplicating it', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({
      id: 'ou-joiner',
      status: 'ACTIVE',
    } as never);
    prismaMock.planGroupMember.findFirst.mockResolvedValue({ id: 'pgm-1' } as never);

    const result = await joinPlanGroupByCode('user-2', 'Ada', 'K3F8-QPMR');

    expect(result.alreadyMember).toBe(true);
    expect(prismaMock.organizationUser.create).not.toHaveBeenCalled();
    expect(prismaMock.planGroupMember.create).not.toHaveBeenCalled();
  });

  it('reactivates someone who had left the workspace', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({
      id: 'ou-joiner',
      status: 'LEFT',
    } as never);

    await joinPlanGroupByCode('user-2', 'Ada', 'K3F8-QPMR');

    expect(prismaMock.organizationUser.update).toHaveBeenCalledWith({
      where: { id: 'ou-joiner' },
      data: { status: 'ACTIVE', leftAt: null },
    });
  });

  it('throws "Invalid join code" for an unknown code', async () => {
    prismaMock.planGroup.findUnique.mockResolvedValue(null);

    await expect(joinPlanGroupByCode('user-2', 'Ada', 'NOPE-NOPE')).rejects.toThrow(
      'Invalid join code'
    );
  });

  it('refuses a group that has closed joining', async () => {
    prismaMock.planGroup.findUnique.mockResolvedValue({
      ...GROUP,
      joinCodeEnabled: false,
    } as never);

    await expect(joinPlanGroupByCode('user-2', 'Ada', 'K3F8-QPMR')).rejects.toThrow(
      'This group is not accepting new members'
    );
    expect(prismaMock.planGroupMember.create).not.toHaveBeenCalled();
  });
});
