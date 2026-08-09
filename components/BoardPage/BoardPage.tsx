// components/BoardPage/BoardPage.tsx
// Orchestrator: fetches the board, wires up dnd-kit drag-and-drop across
// columns, and opens the task detail panel on card click.
'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerTopbar } from '@/components/PlannerShell';
import { useBoard } from '@/hooks/useBoard';
import { BoardSkeleton } from './BoardSkeleton';
import { BoardColumn } from './BoardColumn';
import { AddColumnPopover } from './AddColumnPopover';
import { BoardTaskCard } from './BoardTaskCard';
import { BoardViewSwitcher, type BoardViewMode } from './BoardViewSwitcher';
import { BoardListView } from './BoardListView';
import { BoardCalendarView } from './BoardCalendarView';
import { BoardTimelineView } from './BoardTimelineView';
import { NewTaskButton } from './NewTaskButton';
import { TaskDetailModal } from '@/components/TaskDetail';

export function BoardPage() {
  const { board, loading, error, refetch, moveTask, addTask, addGroup } = useBoard();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [view, setView] = useState<BoardViewMode>('board');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (loading) return <BoardSkeleton />;

  if (error || !board) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error ?? 'Failed to load board'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeTask = activeTaskId
    ? (board.groups.flatMap((g) => g.taskItems).find((t) => t.id === activeTaskId) ?? null)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const sourceGroup = board.groups.find((g) => g.taskItems.some((t) => t.id === activeId));
    if (!sourceGroup) return;

    const overGroup =
      board.groups.find((g) => g.id === overId) ??
      board.groups.find((g) => g.taskItems.some((t) => t.id === overId));
    if (!overGroup) return;

    let targetIndex = overGroup.taskItems.findIndex((t) => t.id === overId);
    if (targetIndex === -1) targetIndex = overGroup.taskItems.length;

    if (sourceGroup.id === overGroup.id) {
      const sourceIndex = sourceGroup.taskItems.findIndex((t) => t.id === activeId);
      if (sourceIndex === targetIndex) return;
      // Removing the card from its own array first shifts every later index
      // left by one, so a forward move must target one slot earlier.
      if (sourceIndex < targetIndex) targetIndex -= 1;
    }

    void moveTask(activeId, overGroup.id, targetIndex).then((ok) => {
      if (!ok) toast.error('Failed to move task');
    });
  };

  const handleAddTask = async (groupId: string, title: string) => {
    const ok = await addTask(groupId, title);
    if (!ok) toast.error('Failed to add task');
  };

  const handleAddColumn = async (name: string) => {
    const ok = await addGroup(name);
    if (!ok) toast.error('Failed to add column');
  };

  const totalTasks = board.groups.reduce((n, g) => n + g.taskItems.length, 0);
  const subtitle = `${totalTasks} task${totalTasks === 1 ? '' : 's'} · ${board.groups.length} column${board.groups.length === 1 ? '' : 's'}`;

  return (
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar
        title="Board"
        subtitle={subtitle}
        action={<NewTaskButton groups={board.groups} onAddTask={handleAddTask} />}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="mb-5">
          <BoardViewSwitcher value={view} onChange={setView} />
        </div>

        {view === 'board' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {board.groups.map((group) => (
                <BoardColumn
                  key={group.id}
                  group={group}
                  onOpenTask={setOpenTaskId}
                  onAddTask={handleAddTask}
                />
              ))}
              <AddColumnPopover onAddColumn={handleAddColumn} />
            </div>

            <DragOverlay>
              {activeTask ? <BoardTaskCard task={activeTask} onOpen={() => {}} overlay /> : null}
            </DragOverlay>
          </DndContext>
        )}

        {view === 'list' && <BoardListView board={board} onOpenTask={setOpenTaskId} />}
        {view === 'calendar' && <BoardCalendarView board={board} onOpenTask={setOpenTaskId} />}
        {view === 'timeline' && <BoardTimelineView board={board} onOpenTask={setOpenTaskId} />}
      </div>

      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          open={!!openTaskId}
          onOpenChange={(open) => !open && setOpenTaskId(null)}
          onTaskUpdated={() => refetch()}
          groups={board.groups}
        />
      )}
    </div>
  );
}
