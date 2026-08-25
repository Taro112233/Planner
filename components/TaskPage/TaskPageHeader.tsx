// components/TaskPage/TaskPageHeader.tsx
// Breadcrumb back to the board, the topbar with the delete action, and the
// inline-editable task title (shared with the slide-over via TaskTitleEditor).
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PlannerTopbar } from '@/components/PlannerShell';
import { Button } from '@/components/ui/button';
import { TaskTitleEditor } from '@/components/TaskDetail';

interface TaskPageHeaderProps {
  title: string;
  onSave: (title: string) => Promise<boolean>;
  onDeleteClick: () => void;
  /** A title save is in flight. */
  titlePending?: boolean;
  /** A delete is in flight. Separate from titlePending — unrelated actions. */
  deletePending?: boolean;
}

export function TaskPageHeader({
  title,
  onSave,
  onDeleteClick,
  titlePending = false,
  deletePending = false,
}: TaskPageHeaderProps) {
  return (
    <div className="border-b border-border-subtle">
      <div className="px-5 pt-3">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={12} />
          กลับไปที่บอร์ด
        </Link>
      </div>

      <PlannerTopbar
        title="Task"
        action={
          <Button variant="destructive" size="sm" disabled={deletePending} onClick={onDeleteClick}>
            <Trash2 className="size-3.5" />
            ลบ
          </Button>
        }
      />

      <div className="px-5 pb-4">
        <TaskTitleEditor title={title} onSave={onSave} pending={titlePending} variant="page" />
      </div>
    </div>
  );
}
