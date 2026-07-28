// lib/auth-helpers.ts
// NextJS Starter - Authentication Helper Functions

import type { UserRole } from '@prisma/client';

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isValidRole(role: unknown): role is UserRole {
  return role === 'USER' || role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Check if user has admin-level access (ADMIN or SUPERADMIN)
 */
export function hasAdminAccess(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Check if user is SUPERADMIN
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPERADMIN';
}

/**
 * Check if user is ADMIN (not SUPERADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user is regular USER
 */
export function isRegularUser(role: UserRole): boolean {
  return role === 'USER';
}

/**
 * Get role display name (Thai)
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    USER: 'ผู้ใช้',
    ADMIN: 'ผู้ดูแลระบบ',
    SUPERADMIN: 'ผู้ดูแลระบบสูงสุด',
  };
  return roleNames[role];
}

/**
 * Get role display name (English)
 */
export function getRoleDisplayNameEN(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    USER: 'User',
    ADMIN: 'Admin',
    SUPERADMIN: 'Super Admin',
  };
  return roleNames[role];
}

/**
 * Get role badge CSS classes (Tailwind)
 */
export function getRoleBadgeClasses(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    USER: 'bg-surface-secondary text-content-secondary border-border-primary',
    ADMIN: 'bg-alert-info-bg text-alert-info-text border-alert-info-border',
    SUPERADMIN: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  };
  return classes[role];
}

/**
 * Get role icon emoji
 */
export function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    USER: '👤',
    ADMIN: '🛡️',
    SUPERADMIN: '👑',
  };
  return icons[role];
}

/**
 * Get role hierarchy level (higher = more privileges)
 */
export function getRoleHierarchy(role: UserRole): number {
  const hierarchy: Record<UserRole, number> = {
    USER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
  };
  return hierarchy[role];
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  return getRoleHierarchy(currentUserRole) > getRoleHierarchy(targetUserRole);
}

/**
 * Ensure role is valid, fallback to USER if invalid
 */
export function normalizeRole(role: unknown): UserRole {
  if (isValidRole(role)) {
    return role;
  }
  console.warn(`Invalid role detected: ${role}, falling back to USER`);
  return 'USER';
}