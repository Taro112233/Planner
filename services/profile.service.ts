// services/profile.service.ts
// Profile Service — Layer 2 (Business Logic + Database)
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/prisma';
import { normalizeRole } from '@/lib/auth-helpers';
import type { UserRole } from '@prisma/client';

// ─────────────────────────────────────────────
// Shared select projection
// ─────────────────────────────────────────────

export const USER_SELECT = {
  id:            true,
  email:         true,
  name:          true,
  firstName:     true,
  lastName:      true,
  phone:         true,
  image:         true,
  role:          true,
  status:        true,
  isActive:      true,
  emailVerified: true,
  createdAt:     true,
  updatedAt:     true,
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UserProfileData {
  id:            string;
  email:         string;
  name:          string;
  firstName:     string;
  lastName:      string;
  phone:         string | null;
  image:         string | null;
  role:          UserRole;
  status:        string;
  isActive:      boolean;
  emailVerified: boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName:  string;
  phone?:    string;
}

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Retrieve a user's profile by their ID.
 * @throws Error('User not found') when the ID does not match any record.
 */
export async function getProfileById(userId: string): Promise<UserProfileData> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new Error('User not found');
  }

  return { ...user, role: normalizeRole(user.role) as UserRole };
}

/**
 * Update firstName, lastName, and phone for a user.
 * Also keeps the Better Auth `name` field in sync.
 * @throws Error('User not found') when no record matches userId.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfileData> {
  // Verify user exists before attempting update
  const exists = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true },
  });

  if (!exists) {
    throw new Error('User not found');
  }

  const { firstName, lastName, phone } = input;
  const fullName = `${firstName} ${lastName}`;

  const updated = await prisma.user.update({
    where:  { id: userId },
    data:   { firstName, lastName, phone: phone ?? null, name: fullName },
    select: USER_SELECT,
  });

  return { ...updated, role: normalizeRole(updated.role) as UserRole };
}

/**
 * Update a user's avatar URL.
 * Called after the file has been uploaded to storage.
 * @throws Error('User not found') when no record matches userId.
 */
export async function updateAvatar(
  userId: string,
  imageUrl: string
): Promise<UserProfileData> {
  const exists = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true },
  });

  if (!exists) {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where:  { id: userId },
    data:   { image: imageUrl },
    select: USER_SELECT,
  });

  return { ...updated, role: normalizeRole(updated.role) as UserRole };
}
