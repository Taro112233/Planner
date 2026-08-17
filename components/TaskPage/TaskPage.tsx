// components/TaskPage/TaskPage.tsx
// Full-page task detail — Phase 2. Composes the shared TaskDetail pieces
// (status chip row, assignee picker, add-subtask form, recursive subtask
// list) with page-only pieces (editable title, description, priority, dates,
// nested subtask actions, full paginated activity).
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDeleteModal } from '@/components/shared';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { useBoardGroups } from '@/hooks/useBoardGroups';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { StatusChipRow, AssigneePicker, PriorityChipRow } from '@/components/TaskDetail';
import type { TaskPriority } from '@/types/planner';
import { TaskPageSkeleton } from './TaskPageSkeleton';
import { TaskPageHeader } from './TaskPageHeader';
import { TaskPageDescription } from './TaskPageDescription';
import { TaskPageDates } from './TaskPageDates';
import { TaskPageSubtasks } from './TaskPageSubtasks';
import { TaskPageActivity } from './TaskPageActivity';

interface TaskPageProps {
  taskId: string;
}

/** Toasts `label` when an action reports failure, and passes the result on. */
function reportFailure(label: string) {
  return (ok: boolean) => {
    if (!ok) toast.error(label);
    return ok;
  };
}

export function TaskPage({ taskId }: TaskPageProps) {
  const {
    task,
    loading,
    error,
    isPending,
    dataVersion,
    updateTitle,
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
    deleteTask,
  } = useTaskDetail(taskId);
  const { groups } = useBoardGroups();
  const { members } = useOrganizationMembers();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // A refresh that fails once the page is on screen gets a toast, not the
  // destructive Alert below — that one is reserved for the cold-load failure.
  const toastedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) {
      toastedErrorRef.current = null;
      return;
    }
    if (error === toastedErrorRef.current) return;
    toastedErrorRef.current = error;
    if (task) toast.error(error);
  }, [error, task]);

  // Handlers live above the early returns so their identity stays stable
  // across renders (the hooks rules require it, and TaskPageActivity's
  // refresh effect depends on it).
  const handleSaveTitle = useCallback(
    async (title: string) => reportFailure('Failed to update title')(await updateTitle(title)),
    [updateTitle]
  );

  const handleStatusChange = useCallback(
    async (groupId: string) => {
      reportFailure('Failed to change status')(await changeStatus(groupId));
    },
    [changeStatus]
  );

  const handlePriorityChange = useCallback(
    async (priority: TaskPriority) => {
      reportFailure('Failed to update priority')(await updatePriority(priority));
    },
    [updatePriority]
  );

  const handleDatesChange = useCallback(
    async (dates: { startDate: string | null; dueDate: string | null }) => {
      reportFailure('Failed to update dates')(await updateDates(dates));
    },
    [updateDates]
  );

  const handleDescriptionSave = useCallback(
    async (description: string | null) =>
      reportFailure('Failed to update description')(await updateDescription(description)),
    [updateDescription]
  );

  const handleAssigneeToggle = useCallback(
    async (organizationUserId: string, isAssigned: boolean) => {
      const ok = isAssigned ? await unassign(organizationUserId) : await assign(organizationUserId);
      reportFailure('Failed to update assignee')(ok);
    },
    [assign, unassign]
  );

  const handleToggleSubtask = useCallback(
    async (subtaskId: string, desiredIsDone: boolean) => {
      reportFailure('Failed to update subtask')(await toggleSubtask(subtaskId, desiredIsDone));
    },
    [toggleSubtask]
  );

  const handleAddSubtask = useCallback(
    async (title: string, parentSubtaskId?: string) =>
      reportFailure('Failed to add subtask')(await addSubtask(title, parentSubtaskId)),
    [addSubtask]
  );

  const handleRenameSubtask = useCallback(
    async (subtaskId: string, title: string) =>
      reportFailure('Failed to rename subtask')(await renameSubtask(subtaskId, title)),
    [renameSubtask]
  );

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) =>
      reportFailure('Failed to delete subtask')(await deleteSubtask(subtaskId)),
    [deleteSubtask]
  );

  const handleDeleteClick = useCallback(() => setShowDeleteConfirm(true), []);
  const handleDeleteCancel = useCallback(() => setShowDeleteConfirm(false), []);

  const handleDelete = useCallback(async () => {
    const ok = await deleteTask();
    if (!ok) {
      toast.error('Failed to delete task');
      setShowDeleteConfirm(false);
      return;
    }
    router.push('/board');
  }, [deleteTask, router]);

  // Only a cold load shows the skeleton; a background refresh keeps the
  // rendered page in place (see useTaskDetail's fetchTask).
  if (loading && !task) return <TaskPageSkeleton />;

  // Reserved for the cold-load failure. A background fetch or mutation that
  // errors must NOT tear the page down — every route runs through Arcjet, so a
  // transient 429 while editing quickly would otherwise wipe the whole page.
  if (!task) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load task'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <TaskPageHeader
        title={task.title}
        titlePending={isPending('title')}
        deletePending={isPending('delete')}
        onSave={handleSaveTitle}
        onDeleteClick={handleDeleteClick}
      />

      <ConfirmDeleteModal
        open={showDeleteConfirm}
        title="ลบ task นี้?"
        description={`"${task.title}" จะถูกย้ายไปยังถังขยะ คุณสามารถกู้คืนได้ภายหลังจากหน้าถังขยะ`}
        confirmLabel="ลบ"
        onConfirm={handleDelete}
        onCancel={handleDeleteCancel}
        loading={isPending('delete')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section aria-label="Status">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Status</h2>
          <StatusChipRow
            groups={groups}
            activeGroupId={task.groupId}
            disabled={isPending('status')}
            onChange={handleStatusChange}
          />
        </section>

        <section aria-label="Priority">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Priority</h2>
          <PriorityChipRow
            value={task.priority}
            disabled={isPending('priority')}
            onChange={handlePriorityChange}
          />
        </section>

        <section aria-label="Dates">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Dates</h2>
          <TaskPageDates
            startDate={task.startDate}
            dueDate={task.dueDate}
            disabled={isPending('dates')}
            onChange={handleDatesChange}
          />
        </section>

        <TaskPageDescription
          description={task.description}
          saving={isPending('description')}
          onSave={handleDescriptionSave}
        />

        <section aria-label="Assignees">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Assignees</h2>
          <AssigneePicker
            members={members}
            assignees={task.assignees}
            disabled={isPending('assignees')}
            onToggle={handleAssigneeToggle}
          />
        </section>

        <TaskPageSubtasks
          subtasks={task.subtasks}
          menuPending={isPending('subtasks')}
          onToggle={handleToggleSubtask}
          onAddSubtask={handleAddSubtask}
          onRenameSubtask={handleRenameSubtask}
          onDeleteSubtask={handleDeleteSubtask}
        />

        <TaskPageActivity taskId={taskId} refreshKey={dataVersion} />
      </div>
    </div>
  );
}
