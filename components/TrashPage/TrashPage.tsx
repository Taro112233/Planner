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
import { PRIORITY_LABELS, PRIORITY_STYLES } from '@/components/TaskDetail';
import { formatRelativeTime } from '@/lib/shared/date-utils';
import { useTrash } from '@/hooks/useTrash';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { TrashPageSkeleton } from './TrashPageSkeleton';

export function TrashPage() {
  const { scopeQuery } = usePlannerScope();
  const { tasks, loading, error, mutating, restoreTask, permanentlyDeleteTask } = useTrash(scopeQuery);
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
    if (!ok) toast.error('กู้คืนไม่สำเร็จ');
  };

  const handlePurgeConfirm = async () => {
    if (!purgeTargetId) return;
    const ok = await permanentlyDeleteTask(purgeTargetId);
    setPurgeTargetId(null);
    if (!ok) toast.error('ลบถาวรไม่สำเร็จ');
  };

  const purgeTarget = tasks.find((t) => t.id === purgeTargetId);

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar showScope title="ถังขยะ" subtitle={`${tasks.length} งาน · กู้คืนได้จนกว่าจะลบถาวร`} />

      <div className="px-5 pb-6 pt-1">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<Trash2 className="w-16 h-16 text-content-secondary" />}
            title="ถังขยะว่างเปล่า"
            description="task ที่ถูกลบจะแสดงที่นี่ กู้คืนได้ตลอดจนกว่าจะลบถาวร"
          />
        ) : (
          <div className="wcard px-4 pb-3.5 pt-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-[11px] border-t border-border-subtle px-1 py-[9px] first:border-t-0"
              >
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-surface-tertiary text-[13px]" aria-hidden="true">
                  🗑
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-content-primary">{task.title}</p>
                  <p className="mt-px text-[11px] text-content-tertiary">
                    {task.planName ? `${task.planName} › ` : ''}
                    งาน · {task.groupName} · ลบโดย {task.deletedByName} ·{' '}
                    {formatRelativeTime(task.deletedAt)}
                  </p>
                </div>

                <Badge className={PRIORITY_STYLES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>

                <Button
                  variant="secondary"
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
