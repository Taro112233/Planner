// lib/query-builder.ts
// Generic Prisma `where` clause builders derived from URL search params.
// Keeps API route handlers concise and consistent.

// ─────────────────────────────────────────────
// Search helpers
// ─────────────────────────────────────────────

/**
 * Build a Prisma `contains` / `insensitive` filter for a set of string fields.
 *
 * @example
 * const where = buildSearchWhere('alice', ['name', 'email']);
 * // → { OR: [{ name: { contains: 'alice', mode: 'insensitive' } }, { email: { ... } }] }
 */
export function buildSearchWhere(
  search: string,
  fields: string[]
): Record<string, unknown> {
  if (!search || fields.length === 0) return {};

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}

// ─────────────────────────────────────────────
// Date range helpers
// ─────────────────────────────────────────────

/**
 * Build a Prisma date-range filter from optional start/end strings.
 *
 * @example
 * const where = buildDateRangeWhere('2025-01-01', '2025-01-31', 'createdAt');
 * // → { createdAt: { gte: new Date('2025-01-01'), lte: new Date('2025-01-31') } }
 */
export function buildDateRangeWhere(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  field = 'createdAt'
): Record<string, unknown> {
  if (!startDate && !endDate) return {};

  const filter: Record<string, Date> = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }

  return { [field]: filter };
}

// ─────────────────────────────────────────────
// Enum / exact-match helpers
// ─────────────────────────────────────────────

/**
 * Build a Prisma exact-match filter only when the value is non-empty.
 *
 * @example
 * const where = buildEnumWhere('ADMIN', 'role');
 * // → { role: 'ADMIN' }
 */
export function buildEnumWhere(
  value: string | null | undefined,
  field: string
): Record<string, unknown> {
  if (!value) return {};
  return { [field]: value };
}

// ─────────────────────────────────────────────
// Merge helpers
// ─────────────────────────────────────────────

/**
 * Deep-merge multiple Prisma `where` objects, handling `AND`/`OR` arrays.
 *
 * @example
 * const where = mergeWhere(
 *   buildSearchWhere(search, ['name']),
 *   buildEnumWhere(status, 'status')
 * );
 */
export function mergeWhere(
  ...clauses: Record<string, unknown>[]
): Record<string, unknown> {
  return clauses.reduce((acc, clause) => {
    // Merge top-level OR arrays
    if (acc.OR && clause.OR) {
      return {
        ...acc,
        ...clause,
        OR: [...(acc.OR as unknown[]), ...(clause.OR as unknown[])],
      };
    }
    return { ...acc, ...clause };
  }, {});
}
