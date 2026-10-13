// lib/shared/activity-labels.ts
// Thai labels for activity rows (audit log, inbox): the filter chips, and a
// short verb chip per action whose colour follows its category.

import type { ActivityActionValue, AuditCategory } from '@/types/planner';

export const AUDIT_CATEGORIES: { key: AuditCategory; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'tick', label: 'ติ๊กเสร็จ' },
  { key: 'move', label: 'ย้ายสถานะ' },
  { key: 'tasks', label: 'งาน' },
  { key: 'columns', label: 'เพิ่ม/ลบหัวข้อ' },
  { key: 'plans', label: 'แผนงาน' },
];

/** Group-palette colour per category, so chips hold up in both themes. */
const TONE: Record<Exclude<AuditCategory, 'all'>, string> = {
  tick: 'var(--color-group-green)',
  move: 'var(--color-group-blue)',
  tasks: 'var(--color-group-slate)',
  columns: 'var(--color-group-purple)',
  plans: 'var(--color-group-orange)',
};

const VERBS: Record<ActivityActionValue, [string, Exclude<AuditCategory, 'all'>]> = {
  TASK_CREATED: ['สร้างงาน', 'tasks'],
  TASK_UPDATED: ['แก้ไขงาน', 'tasks'],
  TASK_STATUS_CHANGED: ['เปลี่ยนสถานะ', 'move'],
  TASK_MOVED: ['ย้ายงาน', 'move'],
  TASK_ASSIGNED: ['มอบหมาย', 'tasks'],
  TASK_UNASSIGNED: ['ถอนมอบหมาย', 'tasks'],
  TASK_DELETED: ['ลบงาน', 'tasks'],
  TASK_RESTORED: ['กู้คืนงาน', 'tasks'],
  TASK_PURGED: ['ลบถาวร', 'tasks'],
  SUBTASK_CREATED: ['เพิ่มงานย่อย', 'tasks'],
  SUBTASK_RENAMED: ['แก้ชื่องานย่อย', 'tasks'],
  SUBTASK_CHECKED: ['ติ๊กเสร็จ', 'tick'],
  SUBTASK_UNCHECKED: ['ยกเลิกติ๊ก', 'tick'],
  SUBTASK_MOVED: ['ย้ายงานย่อย', 'move'],
  SUBTASK_DELETED: ['ลบงานย่อย', 'tasks'],
  GROUP_CREATED: ['เพิ่มหัวข้อ', 'columns'],
  GROUP_RENAMED: ['แก้ชื่อหัวข้อ', 'columns'],
  GROUP_RECOLORED: ['เปลี่ยนสีหัวข้อ', 'columns'],
  GROUP_DELETED: ['ลบหัวข้อ', 'columns'],
  GROUP_REORDERED: ['จัดลำดับหัวข้อ', 'columns'],
  PLAN_CREATED: ['สร้างแผนงาน', 'plans'],
  PLAN_RENAMED: ['แก้ชื่อแผนงาน', 'plans'],
  PLAN_DELETED: ['ลบแผนงาน', 'plans'],
};

export function auditVerb(action: ActivityActionValue): { label: string; color: string } {
  const [label, category] = VERBS[action];
  return { label, color: TONE[category] };
}

export const ROLE_LABELS: Record<'OWNER' | 'ADMIN' | 'MEMBER', string> = {
  OWNER: 'เจ้าของ',
  ADMIN: 'ผู้ดูแล',
  MEMBER: 'สมาชิก',
};
