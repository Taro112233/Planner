// components/TaskDetail/TaskSubtaskSection.tsx
// Full subtask tree: shared RecursiveSubtaskList + AddSubtaskForm + the
// shared per-row SubtaskRowMenu (rename / delete / add nested subtask) —
// same pieces TaskDetailModal's slide-over uses.
'use client';

import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { ConfirmDeleteModal } from '@/components/shared';
import { RecursiveSubtaskList } from './RecursiveSubtaskList';
import { AddSubtaskForm } from './AddSubtaskForm';
import { SubtaskRowMenu } from './SubtaskRowMenu';
import { countCompleted, countSubtasks } from './subtaskAttribution';
import type { SubtaskNodeDto } from '@/types/planner';

interface TaskSubtaskSectionProps {
  subtasks: SubtaskNodeDto[];
  /**
   * A subtask mutation is in flight. Gates the per-row action menu only —
   * checkboxes stay live because `onToggle` sends an explicit desired state
   * (not a blind toggle), so rapid or out-of-order clicks converge.
   */
  menuPending?: boolean;
  /** Show the done/total counter and progress bar next to the heading. */
  showProgress?: boolean;
  onToggle: (subtaskId: string, desiredIsDone: boolean) => void;
  onAddSubtask: (title: string, parentSubtaskId?: string) => Promise<boolean>;
  onRenameSubtask: (subtaskId: string, title: string) => Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => Promise<boolean>;
  /** Omit to render the tree without drag handles. */
  onMoveSubtask?: (
    subtaskId: string,
    targetIndex: number,
    parentSubtaskId?: string | null
  ) => Promise<boolean>;
}

export function TaskSubtaskSection({
  subtasks,
  menuPending = false,
  showProgress = false,
  onToggle,
  onAddSubtask,
  onRenameSubtask,
  onDeleteSubtask,
  onMoveSubtask,
}: TaskSubtaskSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // A small activation distance keeps a click on the grip from registering as
  // a drag, and leaves the checkbox and row menu clickable.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  /** The level a row lives on, plus the parent that owns it. */
  const locate = (
    nodes: SubtaskNodeDto[],
    subtaskId: string,
    parent: SubtaskNodeDto | null = null
  ): { siblings: SubtaskNodeDto[]; parentId: string | null; node: SubtaskNodeDto } | null => {
    const node = nodes.find((candidate) => candidate.id === subtaskId);
    if (node) return { siblings: nodes, parentId: parent?.id ?? null, node };

    for (const candidate of nodes) {
      const found = locate(candidate.children, subtaskId, candidate);
      if (found) return found;
    }
    return null;
  };

  /** How many levels deep the row's own subtree goes. */
  const heightOf = (node: SubtaskNodeDto): number =>
    node.children.length === 0 ? 0 : 1 + Math.max(...node.children.map(heightOf));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !onMoveSubtask) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const from = locate(subtasks, activeId);
    const to = locate(subtasks, overId);
    if (!from || !to) return;

    // Dropping a row inside its own subtree would detach that branch.
    if (locate([from.node], overId)) return;

    // Landing next to a row means becoming its sibling — that is what makes a
    // drop onto a different level reparent rather than be rejected.
    const targetParentId = to.parentId;
    const sameLevel = from.parentId === targetParentId;

    let index = to.siblings.findIndex((node) => node.id === overId);
    if (sameLevel) {
      const currentIndex = from.siblings.findIndex((node) => node.id === activeId);
      // Removing the row first shifts every later index left by one.
      if (currentIndex < index) index -= 1;
      if (currentIndex === index) return;
    }

    if (!sameLevel) {
      const targetDepth = to.node.depth;
      // The schema caps the tree at three levels (invariant I2); refuse here
      // rather than let the server reject and the optimistic move snap back.
      if (targetDepth + heightOf(from.node) > 2) {
        toast.error('ย้ายไม่ได้ — งานย่อยซ้อนได้ลึกสุด 3 ชั้น');
        return;
      }
    }

    void onMoveSubtask(activeId, index, sameLevel ? undefined : targetParentId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await onDeleteSubtask(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Counts every level, unlike TaskItem.subtaskTotal/Done which count root
  // subtasks only (prisma/Instruction-task.md invariant I6).
  const total = showProgress ? countSubtasks(subtasks) : 0;
  const completed = showProgress ? countCompleted(subtasks) : 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section aria-label="Subtasks">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Subtasks</h2>
        {showProgress && total > 0 && (
          <span className="text-xs text-content-tertiary tabular-nums">
            {completed}/{total}
          </span>
        )}
      </div>

      {showProgress && total > 0 && (
        <div
          className="mb-4 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progressPct}% of subtasks completed`}
        >
          <div
            className="h-full rounded-full bg-interactive-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {subtasks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <RecursiveSubtaskList
          subtasks={subtasks}
          onToggle={onToggle}
          sortable={Boolean(onMoveSubtask)}
          renderNodeExtra={(subtask, depth) => (
            <SubtaskRowMenu
              subtask={subtask}
              depth={depth}
              disabled={menuPending}
              onAddChild={(title) => onAddSubtask(title, subtask.id)}
              onRename={(title) => onRenameSubtask(subtask.id, title)}
              onDeleteRequest={() => setDeleteTarget({ id: subtask.id, title: subtask.title })}
            />
          )}
        />
        </DndContext>
      ) : (
        <p className="text-sm text-content-tertiary mb-2">No subtasks yet.</p>
      )}

      <div className="mt-2">
        {/* No `disabled` here on purpose — see AddSubtaskForm: a flag that
            flips during submit blurs the input and collapses the form. */}
        <AddSubtaskForm onSubmit={(title) => onAddSubtask(title)} />
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete subtask?"
        description={
          deleteTarget ? `"${deleteTarget.title}" and any of its own subtasks will be removed.` : undefined
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </section>
  );
}
