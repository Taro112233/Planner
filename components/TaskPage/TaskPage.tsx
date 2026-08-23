// components/TaskPage/TaskPage.tsx
// Full-page task detail. Owns the page chrome — breadcrumb, topbar, editable
// title, delete flow, load/error states — and delegates every field section to
// the shared TaskDetailBody, which the board's slide-over renders too.
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
import { TaskDetailBody } from '@/components/TaskDetail';
import { TaskPageSkeleton } from './TaskPageSkeleton';
import { TaskPageHeader } from './TaskPageHeader';
import { TaskPageActivity } from './TaskPageActivity';

interface TaskPageProps {
  taskId: string;
}

export function TaskPage({ taskId }: TaskPageProps) {
  const detail = useTaskDetail(taskId);
  const { task, loading, error, isPending, dataVersion, updateTitle, deleteTask } = detail;
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
    async (title: string) => {
      const ok = await updateTitle(title);
      if (!ok) toast.error('เปลี่ยนชื่องานไม่สำเร็จ');
      return ok;
    },
    [updateTitle]
  );

  const handleDeleteClick = useCallback(() => setShowDeleteConfirm(true), []);
  const handleDeleteCancel = useCallback(() => setShowDeleteConfirm(false), []);

  const handleDelete = useCallback(async () => {
    const ok = await deleteTask();
    if (!ok) {
      toast.error('ลบงานไม่สำเร็จ');
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TaskDetailBody
          task={task}
          detail={detail}
          groups={groups}
          members={members}
          activitySlot={<TaskPageActivity taskId={taskId} refreshKey={dataVersion} />}
        />
      </div>
    </div>
  );
}
