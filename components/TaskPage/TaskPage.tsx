// components/TaskPage/TaskPage.tsx
// Full-page task detail — Phase 2. Composes the shared TaskDetail pieces
// (status chip row, assignee picker, add-subtask form, recursive subtask
// list) with page-only pieces (editable title, description, priority, dates,
// nested subtask actions, full paginated activity).
'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { useBoardGroups } from '@/hooks/useBoardGroups';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { StatusChipRow, AssigneePicker } from '@/components/TaskDetail';
import { TaskPageSkeleton } from './TaskPageSkeleton';
import { TaskPageHeader } from './TaskPageHeader';
import { TaskPageDescription } from './TaskPageDescription';
import { TaskPagePriority } from './TaskPagePriority';
import { TaskPageDates } from './TaskPageDates';
import { TaskPageSubtasks } from './TaskPageSubtasks';
import { TaskPageActivity } from './TaskPageActivity';

interface TaskPageProps {
  taskId: string;
}

export function TaskPage({ taskId }: TaskPageProps) {
  const {
    task,
    loading,
    error,
    mutating,
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
  } = useTaskDetail(taskId);
  const { groups } = useBoardGroups();
  const { members } = useOrganizationMembers();

  if (loading) return <TaskPageSkeleton />;

  if (error || !task) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load task'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const guard = (label: string) => async (ok: boolean) => {
    if (!ok) toast.error(label);
    return ok;
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      <TaskPageHeader
        title={task.title}
        disabled={mutating}
        onSave={async (title) => guard('Failed to update title')(await updateTitle(title))}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section aria-label="Status">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Status</h2>
          <StatusChipRow
            groups={groups}
            activeGroupId={task.groupId}
            disabled={mutating}
            onChange={async (groupId) => guard('Failed to change status')(await changeStatus(groupId))}
          />
        </section>

        <section aria-label="Priority">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Priority</h2>
          <TaskPagePriority
            priority={task.priority}
            disabled={mutating}
            onChange={async (priority) => guard('Failed to update priority')(await updatePriority(priority))}
          />
        </section>

        <section aria-label="Dates">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Dates</h2>
          <TaskPageDates
            startDate={task.startDate}
            dueDate={task.dueDate}
            disabled={mutating}
            onChange={async (dates) => guard('Failed to update dates')(await updateDates(dates))}
          />
        </section>

        <TaskPageDescription
          description={task.description}
          disabled={mutating}
          onSave={async (description) =>
            guard('Failed to update description')(await updateDescription(description))
          }
        />

        <section aria-label="Assignees">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">Assignees</h2>
          <AssigneePicker
            members={members}
            assignees={task.assignees}
            disabled={mutating}
            onToggle={async (organizationUserId, isAssigned) => {
              const ok = isAssigned ? await unassign(organizationUserId) : await assign(organizationUserId);
              await guard('Failed to update assignee')(ok);
            }}
          />
        </section>

        <TaskPageSubtasks
          subtasks={task.subtasks}
          isToggling={mutating}
          isMutating={mutating}
          onToggle={async (subtaskId) => guard('Failed to update subtask')(await toggleSubtask(subtaskId))}
          onAddSubtask={async (title, parentSubtaskId) =>
            guard('Failed to add subtask')(await addSubtask(title, parentSubtaskId))
          }
          onRenameSubtask={async (subtaskId, title) =>
            guard('Failed to rename subtask')(await renameSubtask(subtaskId, title))
          }
          onDeleteSubtask={async (subtaskId) => guard('Failed to delete subtask')(await deleteSubtask(subtaskId))}
        />

        <TaskPageActivity taskId={taskId} />
      </div>
    </div>
  );
}
