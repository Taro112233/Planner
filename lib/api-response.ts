// lib/api-response.ts
// Factory helpers for consistent Next.js API route responses.
//
// Usage in a route handler:
//   return apiSuccess(data)
//   return apiError('Not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND)
//   return paginatedSuccess(items, { page, limit, total })

import { NextResponse } from 'next/server';
import {
  HTTP_STATUS,
  ERROR_CODES,
  type HttpStatus,
  type ErrorCode,
  type PaginationMeta,
  type ValidationError,
} from '@/types/api';

// ─────────────────────────────────────────────
// Success responses
// ─────────────────────────────────────────────

/**
 * Return a single-resource success response.
 * @param data      The payload to serialize.
 * @param message   Optional human-readable message.
 * @param status    HTTP status code (default 200).
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: HttpStatus = HTTP_STATUS.OK
): NextResponse {
  return NextResponse.json(
    { success: true, data, ...(message && { message }) },
    { status }
  );
}

/**
 * Return a paginated list response.
 * @param items   The page of records.
 * @param meta    Pagination metadata ({ page, limit, total }).
 */
export function paginatedSuccess<T>(
  items: T[],
  meta: { page: number; limit: number; total: number }
): NextResponse {
  const totalPages = Math.ceil(meta.total / meta.limit);

  const pagination: PaginationMeta = {
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    totalPages,
    hasNextPage: meta.page < totalPages,
    hasPreviousPage: meta.page > 1,
  };

  return NextResponse.json(
    { success: true, data: { items, pagination } },
    { status: HTTP_STATUS.OK }
  );
}

/**
 * Return a 201 Created response (e.g., after POST).
 */
export function apiCreated<T>(data: T, message?: string): NextResponse {
  return apiSuccess(data, message, HTTP_STATUS.CREATED);
}

/**
 * Return a 204 No Content response (e.g., after DELETE).
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// ─────────────────────────────────────────────
// Error responses
// ─────────────────────────────────────────────

/**
 * Return a generic error response.
 * @param message  Human-readable error message.
 * @param status   HTTP status code (default 500).
 * @param code     Machine-readable error code.
 * @param details  Per-field validation errors.
 */
export function apiError(
  message: string,
  status: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: ErrorCode,
  details?: ValidationError[]
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/** 400 Bad Request */
export function apiBadRequest(
  message = 'Invalid request',
  details?: ValidationError[]
): NextResponse {
  return apiError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
}

/** 401 Unauthorized */
export function apiUnauthorized(message = 'Authentication required'): NextResponse {
  return apiError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
}

/** 403 Forbidden */
export function apiForbidden(message = 'Insufficient privileges'): NextResponse {
  return apiError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
}

/** 404 Not Found */
export function apiNotFound(message = 'Resource not found'): NextResponse {
  return apiError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
}

/** 409 Conflict */
export function apiConflict(message = 'Resource already exists'): NextResponse {
  return apiError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
}

/** 429 Too Many Requests */
export function apiRateLimited(message = 'Too many requests'): NextResponse {
  return apiError(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMITED);
}

/** 500 Internal Server Error */
export function apiInternalError(message = 'Internal server error'): NextResponse {
  return apiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
}

// ─────────────────────────────────────────────
// Zod validation helper
// ─────────────────────────────────────────────

import type { ZodError } from 'zod';

/**
 * Convert a ZodError into a 400 Bad Request response with per-field details.
 */
export function apiZodError(zodError: ZodError): NextResponse {
  const details: ValidationError[] = zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return apiBadRequest('Validation failed', details);
}
