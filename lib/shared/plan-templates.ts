// lib/shared/plan-templates.ts
// Built-in plan templates ("เทมเพลต" in the mockup): a ready-made set of
// columns to start a new plan from. Shared because the templates page renders
// them and services/plan.service.ts creates the columns from them.

import type { GroupColorKey } from './group-colors';

export interface PlanTemplate {
  id: string;
  name: string;
  /** One or two glyphs shown in the template's colour tile. */
  icon: string;
  color: GroupColorKey;
  description: string;
  columns: { name: string; color: GroupColorKey }[];
}

export const PLAN_TEMPLATES = [
  {
    id: 'sprint',
    name: 'สปรินต์พัฒนา',
    icon: '⚡',
    color: 'blue',
    description: 'รอบงาน 2 สัปดาห์ ตั้งแต่ backlog ถึงปล่อยงาน',
    columns: [
      { name: 'Backlog', color: 'slate' },
      { name: 'กำลังทำ', color: 'blue' },
      { name: 'รอรีวิว', color: 'purple' },
      { name: 'เสร็จแล้ว', color: 'green' },
    ],
  },
  {
    id: 'campaign',
    name: 'แคมเปญการตลาด',
    icon: '✦',
    color: 'purple',
    description: 'วางแผน ผลิตคอนเทนต์ และติดตามผลแคมเปญ',
    columns: [
      { name: 'ไอเดีย', color: 'slate' },
      { name: 'วางแผน', color: 'blue' },
      { name: 'ผลิตคอนเทนต์', color: 'orange' },
      { name: 'เผยแพร่แล้ว', color: 'green' },
    ],
  },
  {
    id: 'qa',
    name: 'ตรวจรับงาน / QA',
    icon: '✓',
    color: 'orange',
    description: 'มีขั้นตรวจ แก้ไข และอนุมัติก่อนปิดงาน',
    columns: [
      { name: 'ส่งตรวจ', color: 'slate' },
      { name: 'กำลังตรวจ', color: 'blue' },
      { name: 'แก้ไข', color: 'orange' },
      { name: 'อนุมัติแล้ว', color: 'green' },
    ],
  },
  {
    id: 'sales',
    name: 'ไปป์ไลน์การขาย',
    icon: '฿',
    color: 'pink',
    description: 'ติดตามดีลจากลูกค้าใหม่ถึงปิดการขาย',
    columns: [
      { name: 'ลูกค้าใหม่', color: 'slate' },
      { name: 'เสนอราคา', color: 'blue' },
      { name: 'เจรจา', color: 'orange' },
      { name: 'ปิดได้', color: 'green' },
    ],
  },
] as const satisfies readonly PlanTemplate[];

export type PlanTemplateId = (typeof PLAN_TEMPLATES)[number]['id'];

export const PLAN_TEMPLATE_IDS = PLAN_TEMPLATES.map((template) => template.id) as [
  PlanTemplateId,
  ...PlanTemplateId[],
];

export function findPlanTemplate(id: string): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find((template) => template.id === id);
}
