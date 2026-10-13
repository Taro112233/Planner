// lib/shared/member-roles.ts
// Workspace-role rules (OrganizationRole, not the site-wide UserRole), shared
// by services/member.service.ts, which enforces them, and the members page,
// which only offers the changes they allow.
//
//   · OWNER can make any non-owner an ADMIN or a MEMBER
//   · ADMIN can promote a MEMBER to ADMIN, nothing else
//   · OWNER is never assigned or removed through this rule

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type AssignableRole = Exclude<WorkspaceRole, 'OWNER'>;

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: 'เจ้าของ',
  ADMIN: 'ผู้ดูแล',
  MEMBER: 'สมาชิก',
};

/** Whether `actorRole` may move a member from `currentRole` to `nextRole`. */
export function canChangeMemberRole(
  actorRole: WorkspaceRole,
  currentRole: WorkspaceRole,
  nextRole: AssignableRole
): boolean {
  if (currentRole === 'OWNER') return false;
  if (actorRole === 'OWNER') return true;
  return actorRole === 'ADMIN' && currentRole === 'MEMBER' && nextRole === 'ADMIN';
}

/**
 * What each role can do in the planner today — the read-only matrix on the
 * members page. Keep in step with the checks that actually enforce it.
 */
export const WORKSPACE_PERMISSIONS: {
  label: string;
  hint: string;
  roles: Record<WorkspaceRole, boolean>;
}[] = [
  {
    label: 'สร้าง / แก้ไขงาน',
    hint: 'การ์ด งานย่อย ผู้รับผิดชอบ',
    roles: { OWNER: true, ADMIN: true, MEMBER: true },
  },
  {
    label: 'ติ๊กงานเสร็จ',
    hint: 'บันทึกชื่อผู้ติ๊กทุกครั้ง',
    roles: { OWNER: true, ADMIN: true, MEMBER: true },
  },
  {
    label: 'จัดการหัวข้อและแผนงาน',
    hint: 'เพิ่ม เปลี่ยนชื่อ ลบ',
    roles: { OWNER: true, ADMIN: true, MEMBER: true },
  },
  {
    label: 'ลบงาน / ถังขยะ',
    hint: 'กู้คืนหรือลบถาวร',
    roles: { OWNER: true, ADMIN: true, MEMBER: true },
  },
  {
    label: 'ดูประวัติตรวจสอบ',
    hint: 'audit log และส่งออก CSV',
    roles: { OWNER: true, ADMIN: true, MEMBER: false },
  },
  {
    label: 'แต่งตั้งผู้ดูแล',
    hint: 'เลื่อนสมาชิกเป็นผู้ดูแล',
    roles: { OWNER: true, ADMIN: true, MEMBER: false },
  },
  {
    label: 'ลดสิทธิ์ผู้ดูแล',
    hint: 'เปลี่ยนผู้ดูแลกลับเป็นสมาชิก',
    roles: { OWNER: true, ADMIN: false, MEMBER: false },
  },
];
