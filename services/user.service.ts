// services/user.service.ts
// User Service — Layer 2 (Business Logic + Database)
// Covers: admin user listing, role management.
//
// Rules:
//   ✅ All Prisma calls live here
//   ✅ Throws descriptive Error objects on failure
//   🚫 No NextRequest / NextResponse imports
//   🚫 No HTTP status codes

import { prisma } from '@/lib/prisma';
import { normalizeRole, getRoleHierarchy, canManageUser } from '@/lib/auth-helpers';
import { buildSearchWhere, buildEnumWhere, mergeWhere } from '@/lib/query-builder';
import { buildPaginationMeta } from '@/lib/pagination';
import type { UserRole } from '@prisma/client';
import type { PaginationMeta } from '@/types/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface AdminUserData {
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
  lastLogin:     Date | null;
}

export interface ListUsersInput {
  page:    number;
  limit:   number;
  skip:    number;
  search:  string;
  role?:   UserRole | null;
}

export interface ListUsersResult {
  items:      AdminUserData[];
  pagination: PaginationMeta;
}

export interface UpdateRoleInput {
  /** The admin performing the action */
  actorId:   string;
  actorRole: UserRole;
  /** The target user whose role will change */
  targetId:  string;
  newRole:   UserRole;
}

// ─────────────────────────────────────────────
// Shared select projection
// ─────────────────────────────────────────────

const ADMIN_USER_SELECT = {
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
  lastLogin:     true,
} as const;

// ─────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────

/**
 * Return a paginated, optionally filtered list of all users.
 */
export async function listUsers(input: ListUsersInput): Promise<ListUsersResult> {
  const { page, limit, skip, search, role } = input;

  const where = mergeWhere(
    buildSearchWhere(search, ['name', 'email', 'firstName', 'lastName']),
    buildEnumWhere(role ?? null, 'role')
  );

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select:   ADMIN_USER_SELECT,
      orderBy:  { createdAt: 'desc' },
      skip,
      take:     limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map((u) => ({
      ...u,
      role: normalizeRole(u.role) as UserRole,
    })),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

/**
 * Change a user's role, enforcing hierarchy rules.
 *
 * Business rules:
 *   - Target user must exist.
 *   - Actor cannot promote someone above their own level.
 *   - Actor cannot modify users at equal or higher hierarchy (unless self-demotion).
 *
 * @throws Error('User not found')
 * @throws Error('Cannot manage a user with equal or higher role')
 * @throws Error('Cannot assign a role higher than your own')
 */
export async function updateUserRole(input: UpdateRoleInput): Promise<AdminUserData> {
  const { actorId, actorRole, targetId, newRole } = input;

  // Fetch target
  const target = await prisma.user.findUnique({
    where:  { id: targetId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!target) {
    throw new Error('User not found');
  }

  const targetRole   = normalizeRole(target.role) as UserRole;
  const isSelf       = actorId === targetId;

  if (isSelf) {
    // Self-edit: may not self-promote
    if (getRoleHierarchy(newRole) > getRoleHierarchy(actorRole)) {
      throw new Error('Cannot assign a role higher than your own');
    }
  } else {
    // Editing another user: must outrank target
    if (!canManageUser(actorRole, targetRole)) {
      throw new Error('Cannot manage a user with equal or higher role');
    }
    // Cannot grant a role higher than actor's own
    if (getRoleHierarchy(newRole) > getRoleHierarchy(actorRole)) {
      throw new Error('Cannot assign a role higher than your own');
    }
  }

  const updated = await prisma.user.update({
    where:  { id: targetId },
    data:   { role: newRole },
    select: ADMIN_USER_SELECT,
  });

  return { ...updated, role: normalizeRole(updated.role) as UserRole };
}
