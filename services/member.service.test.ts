// services/member.service.test.ts
// Unit tests for MemberService and InboxService. Prisma is fully mocked.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import {
  CANNOT_MANAGE_MEMBER,
  MEMBER_NOT_FOUND,
  canChangeMemberRole,
  listWorkspaceMembers,
  updateMemberRole,
} from './member.service';
import { listInbox } from './inbox.service';

describe('canChangeMemberRole', () => {
  it('lets an owner set any non-owner', () => {
    expect(canChangeMemberRole('OWNER', 'ADMIN', 'MEMBER')).toBe(true);
    expect(canChangeMemberRole('OWNER', 'MEMBER', 'ADMIN')).toBe(true);
  });

  it('lets an admin only promote members', () => {
    expect(canChangeMemberRole('ADMIN', 'MEMBER', 'ADMIN')).toBe(true);
    expect(canChangeMemberRole('ADMIN', 'ADMIN', 'MEMBER')).toBe(false);
  });

  it('never touches the owner, and members manage nobody', () => {
    expect(canChangeMemberRole('OWNER', 'OWNER', 'ADMIN')).toBe(false);
    expect(canChangeMemberRole('MEMBER', 'MEMBER', 'ADMIN')).toBe(false);
  });
});

describe('updateMemberRole', () => {
  const owner = { organizationUserId: 'ou-owner', role: 'OWNER' as const };

  it('updates the role', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({ id: 'ou-2', role: 'MEMBER' } as never);
    prismaMock.organizationUser.update.mockResolvedValue({ role: 'ADMIN' } as never);

    await expect(updateMemberRole('org-1', owner, 'ou-2', 'ADMIN')).resolves.toBe('ADMIN');
    expect(prismaMock.organizationUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ou-2' }, data: { role: 'ADMIN' } })
    );
  });

  it('refuses to change your own role', async () => {
    await expect(updateMemberRole('org-1', owner, 'ou-owner', 'MEMBER')).rejects.toThrow(
      CANNOT_MANAGE_MEMBER
    );
  });

  it('throws when the member is not in the workspace', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue(null);
    await expect(updateMemberRole('org-1', owner, 'ghost', 'ADMIN')).rejects.toThrow(
      MEMBER_NOT_FOUND
    );
  });

  it('refuses an admin demoting another admin', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({ id: 'ou-3', role: 'ADMIN' } as never);
    await expect(
      updateMemberRole('org-1', { organizationUserId: 'ou-2', role: 'ADMIN' }, 'ou-3', 'MEMBER')
    ).rejects.toThrow(CANNOT_MANAGE_MEMBER);
    expect(prismaMock.organizationUser.update).not.toHaveBeenCalled();
  });
});

describe('listWorkspaceMembers', () => {
  it('counts only unfinished cards', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([
      {
        id: 'ou-1',
        role: 'OWNER',
        firstName: 'Ada',
        lastName: 'L',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        user: { image: null, email: 'ada@example.com' },
        taskAssignments: [{ taskItem: { groupId: 'todo' } }, { taskItem: { groupId: 'done' } }],
      },
    ] as never);
    prismaMock.plan.findMany.mockResolvedValue([{ groups: [{ id: 'todo' }, { id: 'done' }] }] as never);

    const [member] = await listWorkspaceMembers('org-1');
    expect(member).toMatchObject({ name: 'Ada L', email: 'ada@example.com', openTaskCount: 1 });
  });
});

describe('listWorkspaceMembers (group scope)', () => {
  it('lists only group members, with their group role', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([
      {
        id: 'ou-1',
        role: 'MEMBER',
        firstName: 'Ada',
        lastName: 'L',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        user: { image: null, email: 'ada@example.com' },
        taskAssignments: [],
        planGroupMembers: [{ role: 'OWNER' }],
      },
    ] as never);
    prismaMock.plan.findMany.mockResolvedValue([] as never);

    const [member] = await listWorkspaceMembers('org-1', 'pg-1');

    expect(member.groupRole).toBe('OWNER');
    expect(prismaMock.organizationUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          status: 'ACTIVE',
          planGroupMembers: { some: { planGroupId: 'pg-1' } },
        },
      })
    );
  });
});

describe('listInbox', () => {
  it('returns nothing without assignments', async () => {
    prismaMock.taskAssignee.findMany.mockResolvedValue([]);
    await expect(listInbox('org-1', 'ou-1')).resolves.toEqual([]);
    expect(prismaMock.taskActivity.findMany).not.toHaveBeenCalled();
  });

  it("lists others' activity on my cards, newest first", async () => {
    prismaMock.taskAssignee.findMany.mockResolvedValue([{ taskItemId: 't-1' }] as never);
    prismaMock.taskActivity.findMany.mockResolvedValue([
      {
        id: 'a-1',
        action: 'SUBTASK_CHECKED',
        taskItemId: 't-1',
        actorNameSnapshot: 'Bob',
        actorAvatarSnapshot: null,
        targetTitle: 'Copy',
        taskItemTitleSnapshot: 'Landing',
        planNameSnapshot: 'แผนงานหลัก',
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    ] as never);

    const [item] = await listInbox('org-1', 'ou-1');
    expect(item).toMatchObject({ taskItemId: 't-1', taskTitle: 'Landing', planName: 'แผนงานหลัก' });
    expect(prismaMock.taskActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', taskItemId: { in: ['t-1'] }, actorId: { not: 'ou-1' } },
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});
