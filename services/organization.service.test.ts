// services/organization.service.test.ts
// Unit tests for OrganizationService (default org resolution + member listing).
// Prisma is fully mocked — no database connection required.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { getOrCreateDefaultOrganization, listOrganizationMembers } from './organization.service';

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
    expect(prismaMock.group.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ name: 'To Do' })]),
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
