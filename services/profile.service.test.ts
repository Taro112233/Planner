// services/profile.service.test.ts
// Unit tests for ProfileService.
// Prisma is fully mocked — no database connection required.

import { describe, it, expect, vi } from 'vitest';

// ⚠️  Must be imported BEFORE the service so vi.mock() hoisting intercepts prisma
import '@/tests/prisma-mock';
import { prismaMock } from '@/tests/prisma-mock';

import {
  getProfileById,
  updateProfile,
  updateAvatar,
} from './profile.service';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const BASE_USER = {
  id:            'user-1',
  email:         'alice@example.com',
  name:          'Alice Smith',
  firstName:     'Alice',
  lastName:      'Smith',
  phone:         null,
  image:         null,
  role:          'USER' as const,
  status:        'ACTIVE',
  isActive:      true,
  emailVerified: true,
  createdAt:     new Date('2024-01-01T00:00:00Z'),
  updatedAt:     new Date('2024-06-01T00:00:00Z'),
  lastLogin:     null,
};

// ─────────────────────────────────────────────
// getProfileById
// ─────────────────────────────────────────────

describe('getProfileById', () => {
  it('returns the user profile when the ID exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(BASE_USER);

    const result = await getProfileById('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('alice@example.com');
    expect(result.role).toBe('USER');

    expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
  });

  it('throws "User not found" when the ID does not match any record', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(getProfileById('nonexistent')).rejects.toThrow('User not found');
  });

  it('normalises an unknown role to USER', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...BASE_USER,
      role: 'UNKNOWN_ROLE' as any,
    });

    const result = await getProfileById('user-1');
    expect(result.role).toBe('USER');
  });
});

// ─────────────────────────────────────────────
// updateProfile
// ─────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates and returns the user when input is valid', async () => {
    const updated = { ...BASE_USER, firstName: 'Alicia', lastName: 'Jones', name: 'Alicia Jones' };

    // First call: existence check
    prismaMock.user.findUnique.mockResolvedValue({ ...BASE_USER });
    // Second call: update
    prismaMock.user.update.mockResolvedValue(updated);

    const result = await updateProfile('user-1', {
      firstName: 'Alicia',
      lastName:  'Jones',
    });

    expect(result.firstName).toBe('Alicia');
    expect(result.lastName).toBe('Jones');
    expect(result.name).toBe('Alicia Jones');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data:  expect.objectContaining({
          firstName: 'Alicia',
          lastName:  'Jones',
          name:      'Alicia Jones',
          phone:     null,
        }),
      })
    );
  });

  it('sets phone to null when phone is omitted', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...BASE_USER });
    prismaMock.user.update.mockResolvedValue(BASE_USER);

    await updateProfile('user-1', { firstName: 'Alice', lastName: 'Smith' });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: null }),
      })
    );
  });

  it('persists the phone number when provided', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...BASE_USER });
    prismaMock.user.update.mockResolvedValue({ ...BASE_USER, phone: '0812345678' });

    const result = await updateProfile('user-1', {
      firstName: 'Alice',
      lastName:  'Smith',
      phone:     '0812345678',
    });

    expect(result.phone).toBe('0812345678');
  });

  it('throws "User not found" when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      updateProfile('ghost', { firstName: 'X', lastName: 'Y' })
    ).rejects.toThrow('User not found');

    // update should never be called
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('concatenates firstName + lastName into the name field', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...BASE_USER });
    prismaMock.user.update.mockResolvedValue({
      ...BASE_USER,
      firstName: 'John',
      lastName:  'Doe',
      name:      'John Doe',
    });

    const result = await updateProfile('user-1', {
      firstName: 'John',
      lastName:  'Doe',
    });

    expect(result.name).toBe('John Doe');
  });
});

// ─────────────────────────────────────────────
// updateAvatar
// ─────────────────────────────────────────────

describe('updateAvatar', () => {
  it('saves the new image URL and returns updated user', async () => {
    const imageUrl = 'https://cdn.example.com/avatars/user-1/ts-avatar.png';
    const updated  = { ...BASE_USER, image: imageUrl };

    prismaMock.user.findUnique.mockResolvedValue({ ...BASE_USER });
    prismaMock.user.update.mockResolvedValue(updated);

    const result = await updateAvatar('user-1', imageUrl);

    expect(result.image).toBe(imageUrl);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { image: imageUrl },
      })
    );
  });

  it('throws "User not found" when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      updateAvatar('ghost', 'https://example.com/img.png')
    ).rejects.toThrow('User not found');

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
