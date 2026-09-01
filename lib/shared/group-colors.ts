// lib/shared/group-colors.ts
// The palette a Kanban column can be tagged with. Group.color stores the KEY
// ("blue"), never CSS — that keeps the value validatable with z.enum on the
// API side and lets the rendered color follow the light/dark theme.
//
// Lives in lib/shared because both the route's Zod schema (server) and the
// board components (client) need it.

export const GROUP_COLOR_KEYS = [
  'slate',
  'blue',
  'orange',
  'green',
  'purple',
  'pink',
  'teal',
  'yellow',
] as const;

export type GroupColorKey = (typeof GROUP_COLOR_KEYS)[number];

/** Thai labels for the swatch tooltips/aria-labels. */
export const GROUP_COLOR_LABELS: Record<GroupColorKey, string> = {
  slate: 'เทา',
  blue: 'น้ำเงิน',
  orange: 'ส้ม',
  green: 'เขียว',
  purple: 'ม่วง',
  pink: 'ชมพู',
  teal: 'เขียวน้ำทะเล',
  yellow: 'เหลือง',
};

export function isGroupColorKey(value: string): value is GroupColorKey {
  return (GROUP_COLOR_KEYS as readonly string[]).includes(value);
}

/**
 * CSS color for a persisted Group.color.
 *
 *   'blue'    → 'var(--color-group-blue)'
 *   '#3b82f6' → '#3b82f6'   — columns seeded before the palette existed
 *   null      → the active accent
 *
 * The hex branch is permanent until existing rows are migrated, which needs a
 * migration this phase is not allowed to write.
 */
export function resolveGroupColor(color: string | null): string {
  if (!color) return 'var(--color-interactive-primary)';
  if (isGroupColorKey(color)) return `var(--color-group-${color})`;
  return color;
}
