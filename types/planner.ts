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

export interface BoardGroupDto {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  wipLimit: number | null;
  sortOrder: number;
  taskItems: BoardTaskDto[];
}

export interface BoardDto {
  organizationId: string;
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
  children: SubtaskNodeDto[];
}

export interface TaskActivityDto {
  id: string;
  action: string;
  actorNameSnapshot: string;
  targetTitle: string | null;
  createdAt: string;
}

export interface TaskDetailDto extends BoardTaskDto {
  description: string | null;
  subtasks: SubtaskNodeDto[];
  activities: TaskActivityDto[];
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
