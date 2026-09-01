// components/TaskDetail/TaskDetailBody.tsx
// The one task-detail body. Both surfaces render it: the full page
// (components/TaskPage) and the board's slide-over (TaskDetailModal), so a
// capability added here exists on both — Instruction-task-page.md §2 forbids
// the two drifting apart.
//
// Layout follows the mockup: status / priority / dates / assignees sit
// together in one compact field card rather than as four separate sections
// each with its own heading and margin. On the full page that card moves into
// a right-hand column so the width is spent on the description, the checklist
// and the activity feed instead of on empty gutters.
//
// The only intended difference between the surfaces is the activity feed: the
// page passes its paginated one, the panel passes the latest-10 list off the
// task payload. That is what `activitySlot` is for.
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
  /** 'panel' stacks everything; 'page' puts the field card in a side column. */
  density?: 'panel' | 'page';
}

/** Toasts `label` when an action reports failure, and passes the result on. */
function reportFailure(label: string) {
  return (ok: boolean) => {
    if (!ok) toast.error(label);
    return ok;
  };
}

/** One labelled row inside the field card — label left, control right. */
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="w-24 shrink-0 pt-1 text-xs text-content-tertiary">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

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
    moveSubtask,
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

  const handleMoveSubtask = useCallback(
    async (subtaskId: string, targetIndex: number, parentSubtaskId?: string | null) =>
      reportFailure('ย้ายงานย่อยไม่สำเร็จ')(
        await moveSubtask(subtaskId, targetIndex, parentSubtaskId)
      ),
    [moveSubtask]
  );

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) =>
      reportFailure('ลบงานย่อยไม่สำเร็จ')(await deleteSubtask(subtaskId)),
    [deleteSubtask]
  );

  const fieldCard = (
    <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-secondary">
      <FieldRow label="สถานะ">
        {/* Not gated on isPending: the chip highlight moves optimistically, so
            graying the row out would be the only thing left that reads as a
            freeze. */}
        <StatusChipRow groups={groups} activeGroupId={task.groupId} onChange={handleStatusChange} />
      </FieldRow>

      <FieldRow label="ความสำคัญ">
        <PriorityChipRow value={task.priority} onChange={handlePriorityChange} />
      </FieldRow>

      <FieldRow label="กำหนดส่ง">
        <TaskDatesEditor
          startDate={task.startDate}
          dueDate={task.dueDate}
          onChange={handleDatesChange}
        />
      </FieldRow>

      <FieldRow label="ผู้รับผิดชอบ">
        <AssigneePicker
          members={members}
          assignees={task.assignees}
          disabled={isPending('assignees')}
          onToggle={handleAssigneeToggle}
        />
      </FieldRow>

      {task.badges.length > 0 && (
        <FieldRow label="ป้ายกำกับ">
          <TaskBadgeList badges={task.badges} bare />
        </FieldRow>
      )}
    </div>
  );

  const main = (
    <div className="space-y-5">
      <TaskDescriptionEditor
        description={task.description}
        saving={isPending('description')}
        onSave={handleDescriptionSave}
      />

      <TaskSubtaskSection
        subtasks={task.subtasks}
        menuPending={isPending('subtasks')}
        showProgress
        onToggle={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onRenameSubtask={handleRenameSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onMoveSubtask={handleMoveSubtask}
      />

      <LastCheckedBanner subtasks={task.subtasks} />

      {activitySlot}
    </div>
  );

  if (density === 'panel') {
    return (
      <div className="space-y-4">
        {fieldCard}
        {main}
      </div>
    );
  }

  // Wide screens get two columns so the reading measure stays sane and the
  // fields do not stretch across the whole page.
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      {main}
      <aside className="xl:order-last">{fieldCard}</aside>
    </div>
  );
}
