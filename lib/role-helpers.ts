// lib/role-helpers.ts
// NextJS Starter - Role Management Helper Functions (Simplified)
// ============================================

// ===== ROLE DEFINITIONS =====
export const VALID_ROLES = ['USER', 'ADMIN', 'SUPERADMIN'] as const;
export type UserRole = typeof VALID_ROLES[number];

// ===== VALIDATION =====

/**
 * Validate if role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Get role hierarchy level (higher = more power)
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
 * Check if user is superadmin
 */
export function isSuperAdmin(role: UserRole | string): boolean {
  return role === 'SUPERADMIN';
}

/**
 * Check if user is admin (includes SUPERADMIN)
 */
export function isAdmin(role: UserRole | string): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Check if user is regular user
 */
export function isUser(role: UserRole | string): boolean {
  return role === 'USER';
}

/**
 * Check if user has at least admin privileges
 */
export function hasAdminPrivileges(role: UserRole | string): boolean {
  return isAdmin(role);
}

// ===== PERMISSION CHECKING =====

/**
 * Check if user has permission for action
 */
export function hasPermission(
  userRole: UserRole,
  action: string
): boolean {
  // User permissions (also available to admin & superadmin)
  const userActions = [
    'profile.view',
    'profile.edit',
  ];
  
  // Admin permissions (also available to superadmin)
  const adminActions = [
    ...userActions,
    'users.view_all',
    'dashboard.access',
  ];
  
  // Superadmin can do everything
  if (userRole === 'SUPERADMIN') {
    return true;
  }
  
  // Admin can do admin-level actions
  if (userRole === 'ADMIN') {
    return adminActions.includes(action);
  }
  
  // User can only do user-level actions
  if (userRole === 'USER') {
    return userActions.includes(action);
  }
  
  return false;
}

/**
 * Check if user can manage other users
 * SUPERADMIN: can manage all users including admins
 * ADMIN: can manage regular users only
 * USER: cannot manage users
 */
export function canManageUser(
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean {
  const currentHierarchy = getRoleHierarchy(currentUserRole);
  const targetHierarchy = getRoleHierarchy(targetUserRole);
  
  // Can only manage users with lower hierarchy
  return currentHierarchy > targetHierarchy;
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(role: UserRole): boolean {
  return hasAdminPrivileges(role);
}

/**
 * Check if user can change user roles
 */
export function canChangeUserRole(
  currentUserRole: UserRole,
  targetRole: UserRole
): boolean {
  // Only SUPERADMIN can assign ADMIN or SUPERADMIN roles
  if (targetRole === 'ADMIN' || targetRole === 'SUPERADMIN') {
    return currentUserRole === 'SUPERADMIN';
  }
  
  // ADMIN can assign USER role
  if (targetRole === 'USER') {
    return hasAdminPrivileges(currentUserRole);
  }
  
  return false;
}

// ===== DISPLAY HELPERS =====

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole) {
  const roleInfo: Record<UserRole, {
    label: string;
    labelTh: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
    description: string;
    descriptionTh: string;
  }> = {
    USER: {
      label: 'User',
      labelTh: 'ผู้ใช้',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: 'User',
      description: 'Regular user with basic permissions',
      descriptionTh: 'ผู้ใช้ทั่วไป มีสิทธิ์พื้นฐาน',
    },
    ADMIN: {
      label: 'Admin',
      labelTh: 'ผู้ดูแลระบบ',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: 'Shield',
      description: 'System administrator',
      descriptionTh: 'ผู้ดูแลระบบ',
    },
    SUPERADMIN: {
      label: 'Super Admin',
      labelTh: 'ผู้ดูแลระบบสูงสุด',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      icon: 'Crown',
      description: 'Super administrator with full access',
      descriptionTh: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เต็มที่',
    },
  };
  
  return roleInfo[role];
}

/**
 * Get role badge classes for UI (using semantic design tokens)
 */
export function getRoleBadgeClasses(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    USER: 'bg-surface-secondary text-content-primary border-border-primary',
    ADMIN: 'bg-alert-info-bg text-alert-info-text border-alert-info-border',
    SUPERADMIN: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  };
  
  return classes[role];
}

/**
 * Get role label (localized)
 */
export function getRoleLabel(role: UserRole, locale: 'en' | 'th' = 'th'): string {
  const labels: Record<UserRole, { en: string; th: string }> = {
    USER: { en: 'User', th: 'ผู้ใช้' },
    ADMIN: { en: 'Admin', th: 'ผู้ดูแลระบบ' },
    SUPERADMIN: { en: 'Super Admin', th: 'ผู้ดูแลระบบสูงสุด' },
  };
  
  return labels[role][locale];
}

/**
 * Get all roles that current user can assign
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === 'SUPERADMIN') {
    return ['USER', 'ADMIN', 'SUPERADMIN'];
  }
  
  if (currentUserRole === 'ADMIN') {
    return ['USER'];
  }
  
  return [];
}

/**
 * Get role options for select dropdown
 */
export function getRoleOptions(currentUserRole: UserRole, locale: 'en' | 'th' = 'th') {
  const assignableRoles = getAssignableRoles(currentUserRole);
  
  return assignableRoles.map(role => ({
    value: role,
    label: getRoleLabel(role, locale),
    description: getRoleInfo(role)[locale === 'th' ? 'descriptionTh' : 'description'],
  }));
}