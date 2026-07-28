// types/api.ts
// Standardized API response shapes for consistent client-server contracts.
// Use these types on both the API route (return shape) and the client hook (consume shape).

// ─────────────────────────────────────────────
// Base shapes
// ─────────────────────────────────────────────

/**
 * Single-resource success response.
 * @example { success: true, data: { id: '1', name: 'Alice' } }
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response returned by all API routes on failure.
 * @example { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  /** Machine-readable error code for programmatic handling */
  code?: string;
  /** Per-field validation errors (Zod / input validation failures) */
  details?: ValidationError[];
}

/** Union of success and error responses */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated list response.
 * @example { success: true, data: { items: [...], pagination: { page: 1, ... } } }
 */
export interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: PaginationMeta;
  };
}

// ─────────────────────────────────────────────
// Input / Request shapes
// ─────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

// ─────────────────────────────────────────────
// HTTP status codes (convenience)
// ─────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ─────────────────────────────────────────────
// Error codes
// ─────────────────────────────────────────────

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
