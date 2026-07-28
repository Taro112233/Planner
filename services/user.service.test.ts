// services/user.service.test.ts
// Unit tests for UserService (admin user list + role management).
// Prisma is fully mocked — no database connection required.

import { describe, it, expect } from 'vitest';

import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import { listUsers, updateUserRole } from './user.service'
import { UserRole } from '@prisma/client';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const makeUser = (overrides: Partial<typeof BASE_ADMIN_USER> = {}) => ({
  ...BASE_ADMIN_USER,
  ...overrides,
});

const BASE_ADMIN_USER = {
  id:            'user-1',
  email:         'alice@example.com',
  name:          'Alice Admin',
  firstName:     'Alice',
  lastName:      'Admin',
  phone:         null,
  image:         null,
  role:          'ADMIN' as UserRole,
  status:        'ACTIVE',
  isActive:      true,
  emailVerified: true,
  createdAt:     new Date('2024-01-01T00:00:00Z'),
  updatedAt:     new Date('2024-06-01T00:00:00Z'),
  lastLogin:     null,
};

// ─────────────────────────────────────────────
// listUsers
// ─────────────────────────────────────────────

describe('listUsers', () => {
  it('returns a paginated list of users', async () => {
    const users = [makeUser(), makeUser({ id: 'user-2', email: 'bob@example.com' })];

    prismaMock.user.findMany.mockResolvedValue(users);
    prismaMock.user.count.mockResolvedValue(2);

    const result = await listUsers({ page: 1, limit: 20, skip: 0, search: '' });

    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it('passes skip / take correctly to Prisma', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    await listUsers({ page: 3, limit: 10, skip: 20, search: '' });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it('returns correct pagination metadata for page 2 of 3', async () => {
    prismaMock.user.findMany.mockResolvedValue([makeUser()]);
    prismaMock.user.count.mockResolvedValue(25);

    const result = await listUsers({ page: 2, limit: 10, skip: 10, search: '' });

    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(true);
  });

  it('returns an empty list when no users match filters', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const result = await listUsers({ page: 1, limit: 20, skip: 0, search: 'zzznomatch' });

    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('normalises unknown roles to USER', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      makeUser({ role: 'UNKNOWN_LEGACY' as any }),
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const result = await listUsers({ page: 1, limit: 20, skip: 0, search: '' });

    expect(result.items[0].role).toBe('USER');
  });
});

// ─────────────────────────────────────────────
// updateUserRole
// ─────────────────────────────────────────────

describe('updateUserRole', () => {
  // ── Happy paths ──

  it('SUPERADMIN can promote USER to ADMIN', async () => {
    const target = makeUser({ id: 'user-2', role: 'USER' });

    prismaMock.user.findUnique.mockResolvedValue(target);
    prismaMock.user.update.mockResolvedValue({ ...target, role: 'ADMIN' });

    const result = await updateUserRole({
      actorId:   'superadmin-1',
      actorRole: 'SUPERADMIN',
      targetId:  'user-2',
      newRole:   'ADMIN',
    });

    expect(result.role).toBe('ADMIN');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: 'ADMIN' } })
    );
  });

  it('ADMIN can demote another USER (no change in role level)', async () => {
    const target = makeUser({ id: 'user-3', role: 'USER' });

    prismaMock.user.findUnique.mockResolvedValue(target);
    prismaMock.user.update.mockResolvedValue(target); // stays USER

    const result = await updateUserRole({
      actorId:   'admin-1',
      actorRole: 'ADMIN',
      targetId:  'user-3',
      newRole:   'USER',
    });

    expect(result.role).toBe('USER');
  });

  it('SUPERADMIN can self-demote to ADMIN', async () => {
    const self = makeUser({ id: 'super-1', role: 'SUPERADMIN' });

    prismaMock.user.findUnique.mockResolvedValue(self);
    prismaMock.user.update.mockResolvedValue({ ...self, role: 'ADMIN' });

    const result = await updateUserRole({
      actorId:   'super-1',
      actorRole: 'SUPERADMIN',
      targetId:  'super-1', // same id → isSelf
      newRole:   'ADMIN',
    });

    expect(result.role).toBe('ADMIN');
  });

  // ── Error cases ──

  it('throws "User not found" when target does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      updateUserRole({
        actorId:   'admin-1',
        actorRole: 'ADMIN',
        targetId:  'ghost',
        newRole:   'USER',
      })
    ).rejects.toThrow('User not found');

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('throws when ADMIN tries to modify another ADMIN (same level)', async () => {
    const target = makeUser({ id: 'other-admin', role: 'ADMIN' });
    prismaMock.user.findUnique.mockResolvedValue(target);

    await expect(
      updateUserRole({
        actorId:   'admin-1',
        actorRole: 'ADMIN',
        targetId:  'other-admin',
        newRole:   'USER',
      })
    ).rejects.toThrow('Cannot manage a user with equal or higher role');
  });

  it('throws when ADMIN tries to modify a SUPERADMIN (higher level)', async () => {
    const target = makeUser({ id: 'super-1', role: 'SUPERADMIN' });
    prismaMock.user.findUnique.mockResolvedValue(target);

    await expect(
      updateUserRole({
        actorId:   'admin-1',
        actorRole: 'ADMIN',
        targetId:  'super-1',
        newRole:   'USER',
      })
    ).rejects.toThrow('Cannot manage a user with equal or higher role');
  });

  it('throws when ADMIN tries to assign SUPERADMIN role to a USER', async () => {
    const target = makeUser({ id: 'user-2', role: 'USER' });
    prismaMock.user.findUnique.mockResolvedValue(target);

    await expect(
      updateUserRole({
        actorId:   'admin-1',
        actorRole: 'ADMIN',
        targetId:  'user-2',
        newRole:   'SUPERADMIN', // exceeds actor's own level
      })
    ).rejects.toThrow('Cannot assign a role higher than your own');
  });

  it('throws when user attempts self-promotion beyond own role', async () => {
    const self = makeUser({ id: 'admin-1', role: 'ADMIN' });
    prismaMock.user.findUnique.mockResolvedValue(self);

    await expect(
      updateUserRole({
        actorId:   'admin-1',
        actorRole: 'ADMIN',
        targetId:  'admin-1',   // isSelf
        newRole:   'SUPERADMIN',
      })
    ).rejects.toThrow('Cannot assign a role higher than your own');
  });
});
