// types/planner.ts
// DTO shapes returned by the board/task service layer (services/board.service.ts,
// services/organization.service.ts) and consumed by the BoardPage / TaskDetail
// components. These mirror the normalized Organization → Group → TaskItem →
// Subtask schema in prisma/schemas/{planner,task-item,organization-user}.prisma —
// they are NOT a 1:1 copy of the Prisma models (Decimal fields are serialized to
// `string`, dates to ISO `string`, and relations are flattened into plain arrays).

// ─────────────────────────────────────────────
// Shared leaf types
// ─────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Every value of the ActivityAction enum in prisma/schemas/task-item.prisma,
 * hand-mirrored so this file stays Prisma-free like the two unions above.
 */
export type ActivityActionValue =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_UNASSIGNED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'TASK_RESTORED'
  | 'TASK_PURGED'
  | 'SUBTASK_CREATED'
  | 'SUBTASK_RENAMED'
  | 'SUBTASK_CHECKED'
  | 'SUBTASK_UNCHECKED'
  | 'SUBTASK_MOVED'
  | 'SUBTASK_DELETED';

/** A single organization member assigned to a TaskItem. */
export interface TaskAssigneeDto {
  organizationUserId: string;
  name: string;
  avatarUrl: string | null;
}

/** A label attached to a TaskItem via TaskItemBadge. */
export interface TaskBadgeDto {
  id: string;
  name: string;
  color: string | null;
}

// ─────────────────────────────────────────────
// Board — GET /api/board
// ─────────────────────────────────────────────

export interface BoardTaskDto {
  id: string;
  groupId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Decimal serialized as a string; used only for ordering, never displayed. */
  position: string;
  startDate: string | null;
  dueDate: string | null;
  subtaskTotal: number;
  subtaskDone: number;
  assignees: TaskAssigneeDto[];
  badges: TaskBadgeDto[];
  createdAt: string;
  updatedAt: string;
}

/** A column's own settings, without its cards. Returned by group mutations. */
export interface GroupSettingsDto {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  wipLimit: number | null;
  sortOrder: number;
}

export interface BoardGroupDto extends GroupSettingsDto {
  taskItems: BoardTaskDto[];
}

export interface BoardDto {
  organizationId: string;
  /** The plan this board belongs to — an organization can hold several. */
  planId: string;
  groups: BoardGroupDto[];
}

// ─────────────────────────────────────────────
// Task detail — GET /api/board/tasks/[taskId]
// ─────────────────────────────────────────────

/** A node in the depth-≤2 subtask tree, assembled server-side from flat rows. */
export interface SubtaskNodeDto {
  id: string;
  title: string;
  isDone: boolean;
  depth: number;
  childTotal: number;
  childDone: number;
  /**
   * Snapshot of who ticked this subtask, taken at check time. All three are
   * null while the subtask is not done — setSubtaskDone clears them on uncheck
   * (prisma/Instruction-task.md invariant I7).
   */
  checkedByName: string | null;
  checkedByAvatarUrl: string | null;
  checkedAt: string | null;
  children: SubtaskNodeDto[];
}

export interface TaskActivityDto {
  id: string;
  action: ActivityActionValue;
  actorNameSnapshot: string;
  actorAvatarUrl: string | null;
  targetTitle: string | null;
  createdAt: string;
}

export interface TaskDetailDto extends BoardTaskDto {
  description: string | null;
  subtasks: SubtaskNodeDto[];
  activities: TaskActivityDto[];
}

// ─────────────────────────────────────────────
// Plans and plan groups — GET /api/plans, /api/plan-groups
// ─────────────────────────────────────────────

/**
 * One Kanban board. Note the naming: BoardGroupDto/GroupSummaryDto describe a
 * COLUMN, while PlanGroupDto is the mockup's "กลุ่ม" — a folder of plans.
 */
export interface PlanDto {
  id: string;
  organizationId: string;
  planGroupId: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
}

/** A column chip on a plan card in the group overview. */
export interface PlanColumnSummaryDto {
  id: string;
  name: string;
  color: string | null;
  taskCount: number;
}

/** A plan plus the progress counters the sidebar and group overview render. */
export interface PlanSummaryDto extends PlanDto {
  taskCount: number;
  doneCount: number;
  completionPct: number;
  columns: PlanColumnSummaryDto[];
}

/** A folder of plans — the mockup's "กลุ่มของฉัน". */
export interface PlanGroupDto {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  planCount: number;
}

// ─────────────────────────────────────────────
// Groups — GET /api/board/groups
// ─────────────────────────────────────────────

/** Lightweight column summary for contexts that don't need nested taskItems. */
export interface GroupSummaryDto {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

// ─────────────────────────────────────────────
// Trash — GET /api/board/trash
// ─────────────────────────────────────────────

/** A soft-deleted TaskItem row, listed in the Trash view. */
export interface TrashedTaskDto {
  id: string;
  title: string;
  priority: TaskPriority;
  groupName: string;
  deletedAt: string;
  deletedByName: string;
}

// ─────────────────────────────────────────────
// Organization members — GET /api/board/members
// ─────────────────────────────────────────────

/** An active member of the caller's organization, used by the assignee picker. */
export interface OrganizationMemberDto {
  organizationUserId: string;
  name: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}
