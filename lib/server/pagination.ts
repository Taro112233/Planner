// lib/pagination.ts
// Utilities for parsing URL search params into Prisma-compatible pagination args
// and building PaginationMeta for responses.

import type { PaginationParams } from '@/types/api';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─────────────────────────────────────────────
// Parse from URL
// ─────────────────────────────────────────────

/**
 * Parse pagination parameters from a URL object.
 * Clamps values to safe ranges and falls back to defaults.
 *
 * @example
 * const { page, limit, search, skip } = parsePaginationParams(new URL(request.url));
 */
export function parsePaginationParams(url: URL): Required<PaginationParams> & { skip: number } {
  const rawPage = parseInt(url.searchParams.get('page') ?? '1', 10);
  const rawLimit = parseInt(
    url.searchParams.get('limit') ?? String(PAGINATION_DEFAULTS.LIMIT),
    10
  );

  const page = Math.max(1, isNaN(rawPage) ? PAGINATION_DEFAULTS.PAGE : rawPage);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, isNaN(rawLimit) ? PAGINATION_DEFAULTS.LIMIT : rawLimit)
  );
  const skip = (page - 1) * limit;

  const search = url.searchParams.get('search') ?? '';
  const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (url.searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  return { page, limit, skip, search, sortBy, sortOrder };
}

// ─────────────────────────────────────────────
// Build response metadata
// ─────────────────────────────────────────────

/**
 * Build a PaginationMeta object for API responses.
 *
 * @example
 * const pagination = buildPaginationMeta({ page, limit, total });
 */
export function buildPaginationMeta(opts: {
  page: number;
  limit: number;
  total: number;
}) {
  const { page, limit, total } = opts;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ─────────────────────────────────────────────
// Prisma helpers
// ─────────────────────────────────────────────

/**
 * Convert pagination params to Prisma `skip` / `take` args.
 *
 * @example
 * const { skip, take } = toPrismaSkipTake({ page: 2, limit: 20 });
 * prisma.user.findMany({ skip, take });
 */
export function toPrismaSkipTake(opts: { page: number; limit: number }) {
  return {
    skip: (opts.page - 1) * opts.limit,
    take: opts.limit,
  };
}

/**
 * Convert sortBy / sortOrder params to a Prisma `orderBy` clause.
 *
 * @example
 * const orderBy = toPrismaOrderBy('createdAt', 'desc');
 * prisma.user.findMany({ orderBy });
 */
export function toPrismaOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, 'asc' | 'desc'> {
  return { [sortBy]: sortOrder };
}
