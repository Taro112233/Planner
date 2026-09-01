// components/TrashPage/TrashPage.tsx
// Trash — lists every soft-deleted task in the organization with per-row
// Restore / Delete forever actions. Permanent delete is irreversible, so it
// goes through the same ConfirmDeleteModal used elsewhere in the app.
'use client';

import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteModal, EmptyState } from '@/components/shared';
import { PlannerTopbar } from '@/components/PlannerShell';
import { PRIORITY_STYLES } from '@/components/TaskDetail';
import { formatRelativeTime } from '@/lib/shared/date-utils';
import { useTrash } from '@/hooks/useTrash';
import { TrashPageSkeleton } from './TrashPageSkeleton';

export function TrashPage() {
  const { tasks, loading, error, mutating, restoreTask, permanentlyDeleteTask } = useTrash();
  const [purgeTargetId, setPurgeTargetId] = useState<string | null>(null);

  if (loading) return <TrashPageSkeleton />;

  if (error) {
    return (
      <div className="px-5 py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRestore = async (taskId: string) => {
    const ok = await restoreTask(taskId);
    if (!ok) toast.error('Failed to restore task');
  };

  const handlePurgeConfirm = async () => {
    if (!purgeTargetId) return;
    const ok = await permanentlyDeleteTask(purgeTargetId);
    setPurgeTargetId(null);
    if (!ok) toast.error('Failed to permanently delete task');
  };

  const purgeTarget = tasks.find((t) => t.id === purgeTargetId);

  return (
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar title="ถังขยะ" subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'}`} />

      <div className="px-5 py-5">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<Trash2 className="w-16 h-16 text-content-secondary" />}
            title="ถังขยะว่างเปล่า"
            description="task ที่ถูกลบจะแสดงที่นี่ กู้คืนได้ตลอดจนกว่าจะลบถาวร"
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-secondary px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-content-primary truncate">{task.title}</p>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    {task.groupName} · deleted by {task.deletedByName} ·{' '}
                    {formatRelativeTime(task.deletedAt)}
                  </p>
                </div>

                <Badge className={PRIORITY_STYLES[task.priority]}>{task.priority}</Badge>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={mutating}
                  onClick={() => handleRestore(task.id)}
                >
                  <RotateCcw className="size-3.5" />
                  กู้คืน
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  disabled={mutating}
                  onClick={() => setPurgeTargetId(task.id)}
                >
                  <Trash2 className="size-3.5" />
                  ลบถาวร
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!purgeTargetId}
        title="ลบถาวร?"
        description={
          purgeTarget
            ? `"${purgeTarget.title}" จะถูกลบถาวรและไม่สามารถกู้คืนได้อีก`
            : 'การลบนี้ไม่สามารถย้อนกลับได้'
        }
        confirmLabel="ลบถาวร"
        onConfirm={handlePurgeConfirm}
        onCancel={() => setPurgeTargetId(null)}
        loading={mutating}
      />
    </div>
  );
}
