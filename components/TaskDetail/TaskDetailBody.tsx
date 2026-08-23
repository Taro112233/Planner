// components/TaskDetail/TaskDetailBody.tsx
// The one task-detail body. Both surfaces render it: the full page
// (components/TaskPage) and the board's slide-over (TaskDetailModal), so a
// capability added here exists on both — Instruction-task-page.md §2 forbids
// the two drifting apart.
//
// The only intended difference is the activity feed: the page passes its
// paginated one, the panel passes the latest-10 list off the task payload.
// That is what `activitySlot` is for.
'use client';

import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { StatusChipRow } from './StatusChipRow';
import { PriorityChipRow } from './PriorityChipRow';
import { AssigneePicker } from './AssigneePicker';
import { TaskDatesEditor } from './TaskDatesEditor';
import { TaskDescriptionEditor } from './TaskDescriptionEditor';
import { TaskSubtaskSection } from './TaskSubtaskSection';
import { TaskBadgeList } from './TaskBadgeList';
import { LastCheckedBanner } from './LastCheckedBanner';
import type { UseTaskDetailReturn } from '@/hooks/useTaskDetail';
import type {
  BoardGroupDto,
  GroupSummaryDto,
  OrganizationMemberDto,
  TaskDetailDto,
  TaskPriority,
} from '@/types/planner';

interface TaskDetailBodyProps {
  /** Narrowed non-null by the caller — the hook types it nullable. */
  task: TaskDetailDto;
  /**
   * The whole hook instance rather than eleven callbacks. Couples this
   * component to useTaskDetail's return type on purpose: both callers own an
   * instance, and a new capability then needs no prop plumbing.
   */
  detail: UseTaskDetailReturn;
  groups: (BoardGroupDto | GroupSummaryDto)[];
  members: OrganizationMemberDto[];
  activitySlot: React.ReactNode;
  /** 'panel' tightens the vertical rhythm for the narrower slide-over. */
  density?: 'panel' | 'page';
}

/** Toasts `label` when an action reports failure, and passes the result on. */
function reportFailure(label: string) {
  return (ok: boolean) => {
    if (!ok) toast.error(label);
    return ok;
  };
}

const SECTION_HEADING =
  'mb-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary';

export function TaskDetailBody({
  task,
  detail,
  groups,
  members,
  activitySlot,
  density = 'page',
}: TaskDetailBodyProps) {
  const {
    isPending,
    updateDescription,
    updatePriority,
    updateDates,
    changeStatus,
    assign,
    unassign,
    toggleSubtask,
    addSubtask,
    renameSubtask,
    deleteSubtask,
  } = detail;

  const handleStatusChange = useCallback(
    async (groupId: string) => {
      reportFailure('เปลี่ยนสถานะไม่สำเร็จ')(await changeStatus(groupId));
    },
    [changeStatus]
  );

  const handlePriorityChange = useCallback(
    async (priority: TaskPriority) => {
      reportFailure('เปลี่ยนความสำคัญไม่สำเร็จ')(await updatePriority(priority));
    },
    [updatePriority]
  );

  const handleDatesChange = useCallback(
    async (dates: { startDate: string | null; dueDate: string | null }) => {
      reportFailure('เปลี่ยนวันที่ไม่สำเร็จ')(await updateDates(dates));
    },
    [updateDates]
  );

  const handleDescriptionSave = useCallback(
    async (description: string | null) =>
      reportFailure('บันทึกรายละเอียดไม่สำเร็จ')(await updateDescription(description)),
    [updateDescription]
  );

  const handleAssigneeToggle = useCallback(
    async (organizationUserId: string, isAssigned: boolean) => {
      // Hand the member over so the avatar can appear before the server
      // answers; the response replaces it either way.
      const member = members.find((m) => m.organizationUserId === organizationUserId);
      const ok = isAssigned
        ? await unassign(organizationUserId)
        : await assign(
            organizationUserId,
            member ? { name: member.name, avatarUrl: member.avatarUrl } : undefined
          );
      reportFailure('เปลี่ยนผู้รับผิดชอบไม่สำเร็จ')(ok);
    },
    [assign, unassign, members]
  );

  const handleToggleSubtask = useCallback(
    async (subtaskId: string, desiredIsDone: boolean) => {
      reportFailure('อัปเดตงานย่อยไม่สำเร็จ')(await toggleSubtask(subtaskId, desiredIsDone));
    },
    [toggleSubtask]
  );

  const handleAddSubtask = useCallback(
    async (title: string, parentSubtaskId?: string) =>
      reportFailure('เพิ่มงานย่อยไม่สำเร็จ')(await addSubtask(title, parentSubtaskId)),
    [addSubtask]
  );

  const handleRenameSubtask = useCallback(
    async (subtaskId: string, title: string) =>
      reportFailure('เปลี่ยนชื่องานย่อยไม่สำเร็จ')(await renameSubtask(subtaskId, title)),
    [renameSubtask]
  );

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) =>
      reportFailure('ลบงานย่อยไม่สำเร็จ')(await deleteSubtask(subtaskId)),
    [deleteSubtask]
  );

  return (
    <div className={density === 'panel' ? 'space-y-5' : 'space-y-6'}>
      <section aria-label="Status">
        <h2 className={SECTION_HEADING}>Status</h2>
        {/* Not gated on isPending: the chip highlight moves optimistically, so
            graying the row out would be the only thing left that reads as a
            freeze. */}
        <StatusChipRow groups={groups} activeGroupId={task.groupId} onChange={handleStatusChange} />
      </section>

      <section aria-label="Priority">
        <h2 className={SECTION_HEADING}>Priority</h2>
        <PriorityChipRow value={task.priority} onChange={handlePriorityChange} />
      </section>

      <section aria-label="Dates">
        <h2 className={SECTION_HEADING}>Dates</h2>
        <TaskDatesEditor
          startDate={task.startDate}
          dueDate={task.dueDate}
          onChange={handleDatesChange}
        />
      </section>

      <TaskDescriptionEditor
        description={task.description}
        saving={isPending('description')}
        onSave={handleDescriptionSave}
      />

      <TaskBadgeList badges={task.badges} />

      <section aria-label="Assignees">
        <h2 className={SECTION_HEADING}>Assignees</h2>
        <AssigneePicker
          members={members}
          assignees={task.assignees}
          disabled={isPending('assignees')}
          onToggle={handleAssigneeToggle}
        />
      </section>

      <TaskSubtaskSection
        subtasks={task.subtasks}
        menuPending={isPending('subtasks')}
        showProgress
        onToggle={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onRenameSubtask={handleRenameSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      <LastCheckedBanner subtasks={task.subtasks} />

      {activitySlot}
    </div>
  );
}
