// services/organization.service.test.ts
// Unit tests for OrganizationService (default org resolution + member listing).
// Prisma is fully mocked — no database connection required.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import {
  getOrCreateDefaultOrganization,
  listOrganizationMembers,
  listUserWorkspaces,
  resolveActiveOrganization,
} from './organization.service';

// ─────────────────────────────────────────────
// getOrCreateDefaultOrganization
// ─────────────────────────────────────────────

describe('getOrCreateDefaultOrganization', () => {
  it('returns the existing membership when one is already active', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({
      id: 'ou-1',
      organizationId: 'org-1',
      role: 'OWNER',
      firstName: 'Alice',
      lastName: 'Admin',
    } as never);

    const result = await getOrCreateDefaultOrganization('user-1', 'Alice Admin');

    expect(result).toEqual({
      organizationId: 'org-1',
      organizationUserId: 'ou-1',
      role: 'OWNER',
      firstName: 'Alice',
      lastName: 'Admin',
    });
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });

  it('provisions a new organization, owner membership, and starter groups when none exists', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue(null);
    (prismaMock.$transaction as unknown as { mockImplementation: (fn: unknown) => void }).mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)
    );
    prismaMock.organization.create.mockResolvedValue({ id: 'org-new' } as never);
    prismaMock.organizationUser.create.mockResolvedValue({
      id: 'ou-new',
      organizationId: 'org-new',
      role: 'OWNER',
      firstName: 'Bob',
      lastName: 'Builder',
    } as never);
    prismaMock.plan.create.mockResolvedValue({ id: 'plan-new' } as never);
    prismaMock.group.createMany.mockResolvedValue({ count: 3 } as never);

    const result = await getOrCreateDefaultOrganization('user-2', 'Bob Builder');

    expect(result.organizationId).toBe('org-new');
    expect(result.organizationUserId).toBe('ou-new');
    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Bob Builder's Workspace" }) })
    );
    expect(prismaMock.organizationUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org-new', firstName: 'Bob', lastName: 'Builder', role: 'OWNER' }),
      })
    );
    // Columns hang off the plan, never off the organization directly.
    expect(prismaMock.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org-new', sortOrder: 0 }),
      })
    );
    expect(prismaMock.group.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'To Do', planId: 'plan-new' }),
        ]),
      })
    );
  });
});

// ─────────────────────────────────────────────
// listOrganizationMembers
// ─────────────────────────────────────────────

describe('listOrganizationMembers', () => {
  it('returns active members mapped to OrganizationMemberDto', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([
      {
        id: 'ou-1',
        role: 'OWNER',
        firstName: 'Alice',
        lastName: 'Admin',
        user: { image: 'https://example.com/alice.png' },
      },
      {
        id: 'ou-2',
        role: 'MEMBER',
        firstName: 'Bob',
        lastName: '',
        user: { image: null },
      },
    ] as never);

    const result = await listOrganizationMembers('org-1');

    expect(result).toEqual([
      { organizationUserId: 'ou-1', name: 'Alice Admin', avatarUrl: 'https://example.com/alice.png', role: 'OWNER' },
      { organizationUserId: 'ou-2', name: 'Bob', avatarUrl: null, role: 'MEMBER' },
    ]);
    expect(prismaMock.organizationUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1', status: 'ACTIVE' } })
    );
  });

  it('returns an empty array when the organization has no active members', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([]);

    const result = await listOrganizationMembers('org-empty');

    expect(result).toEqual([]);
  });
});


// ─────────────────────────────────────────────
// listUserWorkspaces
// ─────────────────────────────────────────────

describe('listUserWorkspaces', () => {
  it('flattens every active membership into a switchable workspace', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([
      {
        id: 'ou-1',
        role: 'OWNER',
        organization: { id: 'org-1', name: 'My Workspace', slug: 'org-1' },
      },
      {
        id: 'ou-2',
        role: 'MEMBER',
        organization: { id: 'org-2', name: 'Joined Workspace', slug: 'org-2' },
      },
    ] as never);

    const result = await listUserWorkspaces('user-1');

    expect(result).toEqual([
      {
        organizationId: 'org-1',
        organizationUserId: 'ou-1',
        name: 'My Workspace',
        slug: 'org-1',
        role: 'OWNER',
      },
      {
        organizationId: 'org-2',
        organizationUserId: 'ou-2',
        name: 'Joined Workspace',
        slug: 'org-2',
        role: 'MEMBER',
      },
    ]);
  });

  it('excludes memberships the user has left', async () => {
    prismaMock.organizationUser.findMany.mockResolvedValue([] as never);

    await listUserWorkspaces('user-1');

    expect(prismaMock.organizationUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', status: 'ACTIVE' } })
    );
  });
});

// ─────────────────────────────────────────────
// resolveActiveOrganization
// ─────────────────────────────────────────────

describe('resolveActiveOrganization', () => {
  const MEMBERSHIP = {
    id: 'ou-2',
    organizationId: 'org-2',
    role: 'MEMBER',
    firstName: 'Ada',
    lastName: 'Lovelace',
  };

  it('acts in the requested workspace when the membership is active', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue(MEMBERSHIP as never);

    const result = await resolveActiveOrganization('user-1', 'Ada Lovelace', 'org-2');

    expect(result.organizationId).toBe('org-2');
    expect(prismaMock.organizationUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', organizationId: 'org-2', status: 'ACTIVE' },
      })
    );
  });

  it('falls back to the default workspace for a stale cookie', async () => {
    // First lookup (the requested org) misses; the fallback path then finds
    // the user's own earliest membership.
    prismaMock.organizationUser.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'ou-1',
        organizationId: 'org-1',
        role: 'OWNER',
        firstName: 'Ada',
        lastName: 'Lovelace',
      } as never);

    const result = await resolveActiveOrganization('user-1', 'Ada Lovelace', 'org-gone');

    expect(result.organizationId).toBe('org-1');
  });

  it('skips the membership check entirely when no workspace is requested', async () => {
    prismaMock.organizationUser.findFirst.mockResolvedValue({
      id: 'ou-1',
      organizationId: 'org-1',
      role: 'OWNER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    } as never);

    await resolveActiveOrganization('user-1', 'Ada Lovelace', null);

    expect(prismaMock.organizationUser.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.organizationUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', status: 'ACTIVE' } })
    );
  });
});
