// lib/date-utils.ts
// Generic date formatting and range utilities.
// Framework-agnostic — no React imports, safe to use in server components and API routes.

// ─────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────

/**
 * Format a date as a locale-aware string.
 * @param date    The date to format (Date | ISO string | timestamp).
 * @param locale  BCP-47 locale tag (default: 'en-US').
 * @param options Intl.DateTimeFormat options (default: full date).
 */
export function formatDate(
  date: Date | string | number,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Format a date as YYYY-MM-DD (ISO date string, no time).
 */
export function toISODate(date: Date | string | number): string {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Format a date as a short string (e.g., "Jan 5, 2025").
 */
export function formatShortDate(date: Date | string | number, locale = 'en-US'): string {
  return formatDate(date, locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format a datetime (e.g., "Jan 5, 2025, 14:30").
 */
export function formatDateTime(date: Date | string | number, locale = 'en-US'): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return a relative time string ("3 days ago", "in 2 hours").
 */
export function formatRelativeTime(date: Date | string | number, locale = 'en-US'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = new Date(date).getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1_000);
  const diffMin = Math.round(diffSec / 60);
  const diffHrs = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHrs / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHrs) < 24) return rtf.format(diffHrs, 'hour');
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  if (Math.abs(diffWeeks) < 5) return rtf.format(diffWeeks, 'week');
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');
  return rtf.format(diffYears, 'year');
}

// ─────────────────────────────────────────────
// Date ranges
// ─────────────────────────────────────────────

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Return the start (00:00:00.000) and end (23:59:59.999) of a given day.
 */
export function getDayRange(date: Date | string = new Date()): DateRange {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Return the start and end of the calendar month containing `date`.
 */
export function getMonthRange(date: Date | string = new Date()): DateRange {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Return the start and end of the calendar year containing `date`.
 */
export function getYearRange(date: Date | string = new Date()): DateRange {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

// ─────────────────────────────────────────────
// Fiscal year helpers (configurable)
// ─────────────────────────────────────────────

export interface FiscalYearConfig {
  /** Month (1-12) when the fiscal year starts. Default: 10 (October). */
  startMonth: number;
}

const DEFAULT_FISCAL_CONFIG: FiscalYearConfig = { startMonth: 10 };

/**
 * Get the fiscal year for a given date.
 * By default, fiscal year starts in October (common in government / Asian systems).
 *
 * @example
 * getFiscalYear(new Date('2024-11-01'))   // → 2025 (Oct 2024 → Sep 2025)
 * getFiscalYear(new Date('2024-06-01'))   // → 2024 (Oct 2023 → Sep 2024)
 */
export function getFiscalYear(
  date: Date | string = new Date(),
  config: FiscalYearConfig = DEFAULT_FISCAL_CONFIG
): number {
  const d = new Date(date);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  return month >= config.startMonth ? year + 1 : year;
}

/**
 * Get the fiscal year date range (start and end dates).
 */
export function getFiscalYearRange(
  fiscalYear: number,
  config: FiscalYearConfig = DEFAULT_FISCAL_CONFIG
): DateRange {
  const { startMonth } = config;
  const calendarYear = fiscalYear - 1;
  const start = new Date(calendarYear, startMonth - 1, 1, 0, 0, 0, 0);
  const end = new Date(fiscalYear, startMonth - 2, 1);
  end.setDate(0); // last day of month before startMonth
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────

/** Return true if the value can be parsed as a valid Date. */
export function isValidDate(value: unknown): boolean {
  if (!value) return false;
  const d = new Date(value as string | number);
  return !isNaN(d.getTime());
}

/** Clamp a date to within [min, max]. */
export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}
