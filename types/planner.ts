// types/planner.ts
// Type definitions for the Multi-tenant App Planner feature.
//
// These types correspond to the Prisma JSON fields in Task.subtasks,
// Group.attributes, and Task.planDetails.

// ─────────────────────────────────────────────
// Subtasks — Recursive JSON structure
// ─────────────────────────────────────────────

/**
 * A single subtask node stored inside `Task.subtasks` (Json field).
 *
 * Supports up to 10 levels of nesting — the depth limit is enforced
 * in the UI (RecursiveSubtaskList) via the `depth` prop, NOT in the DB.
 *
 * Shape on disk:
 * [
 *   {
 *     "id": "cuid...",
 *     "title": "Write tests",
 *     "isCompleted": false,
 *     "children": [
 *       { "id": "cuid...", "title": "Unit tests", "isCompleted": true }
 *     ]
 *   }
 * ]
 */
export interface SubtaskProps {
  /** Stable unique identifier (cuid / uuid) — used as the toggle key */
  id: string;
  /** Human-readable label */
  title: string;
  /** Whether the subtask has been checked off */
  isCompleted: boolean;
  /**
   * Child subtasks — omitted (not `[]`) when there are none,
   * so the JSON payload stays compact.
   */
  children?: SubtaskProps[];
}

// ─────────────────────────────────────────────
// Group attributes — JSON field in Group.attributes
// ─────────────────────────────────────────────

/**
 * Optional metadata stored in `Group.attributes` (Json?).
 * All fields are optional — the column can be NULL in the DB.
 */
export interface GroupAttributes {
  /** Background color for the Kanban column header (CSS token or hex) */
  color?: string;
  /** Lucide / custom icon name to display in the column header */
  icon?: string;
  /**
   * Work-in-progress limit — if set, a warning is shown when
   * the number of TODO/IN_PROGRESS tasks in this group exceeds this value.
   */
  wipLimit?: number;
  /** Short description shown as a tooltip on the column */
  description?: string;
}

// ─────────────────────────────────────────────
// Plan details — JSON field in Task.planDetails
// ─────────────────────────────────────────────

/**
 * Optional planning metadata stored in `Task.planDetails` (Json?).
 * All fields are optional — the column can be NULL in the DB.
 */
export interface PlanDetails {
  /** Estimated effort in hours */
  estimatedHours?: number;
  /** Freeform text tags (e.g., ["backend", "urgent"]) */
  tags?: string[];
  /** File attachments linked to the task */
  attachments?: TaskAttachment[];
  /** Arbitrary key-value pairs for future extensions */
  customFields?: Record<string, unknown>;
}

/** A single file attachment linked to a task */
export interface TaskAttachment {
  /** Display name shown in the UI */
  name: string;
  /** Publicly accessible URL (e.g., Vercel Blob URL) */
  url: string;
  /** MIME type — optional, used for icon selection */
  mimeType?: string;
  /** File size in bytes — optional, shown in UI */
  sizeBytes?: number;
}

// ─────────────────────────────────────────────
// API / Service shapes
// ─────────────────────────────────────────────

/**
 * Serialized Task as returned from the service layer.
 * Replaces Prisma's `Json` fields with typed counterparts.
 */
export interface TaskDto {
  id: string;
  organizationId: string;
  groupId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subtasks: SubtaskProps[];
  planDetails: PlanDetails | null;
  dueDate: string | null; // ISO string
  assigneeId: string | null;
  createdById: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
