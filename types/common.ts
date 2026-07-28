// types/common.ts
// Shared domain-agnostic enums and utility types used across the application.

// ─────────────────────────────────────────────
// Entity lifecycle
// ─────────────────────────────────────────────

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

// ─────────────────────────────────────────────
// Sorting / filtering
// ─────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn';

// ─────────────────────────────────────────────
// Generic select option (for <Select> / autocomplete)
// ─────────────────────────────────────────────

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Arbitrary metadata (icon name, color, etc.) */
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// ID helpers
// ─────────────────────────────────────────────

export interface WithId {
  id: string;
}

export interface WithTimestamps {
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BaseEntity extends WithId, WithTimestamps {}

// ─────────────────────────────────────────────
// Misc utility types
// ─────────────────────────────────────────────

/** Make specified keys required (useful when returning DB entities) */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Deep partial — useful for PATCH request bodies */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
