// components/BoardPage/BoardPage.tsx
// Orchestrator: fetches the board, wires up dnd-kit drag-and-drop across
// columns, and opens the task detail panel on card click.
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragOverEvent,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerTopbar, PlannerBreadcrumb } from '@/components/PlannerShell';
import { useBoard } from '@/hooks/useBoard';
import { BoardSkeleton } from './BoardSkeleton';
import { BoardColumn } from './BoardColumn';
import { AddColumnPopover } from './AddColumnPopover';
import { BoardTaskCard } from './BoardTaskCard';
import { BoardViewSwitcher, type BoardViewMode } from './BoardViewSwitcher';
import { BoardListView } from './BoardListView';
import { BoardCalendarView } from './BoardCalendarView';
import { BoardTimelineView } from './BoardTimelineView';
import { TaskCreateMenu } from './TaskCreateMenu';
import { TaskDetailModal } from '@/components/TaskDetail';
import { usePlanNav } from '@/hooks/usePlanNav';
import type { TaskPriority } from '@/types/planner';
import type { GroupColorKey } from '@/lib/shared/group-colors';


/**
 * Prefer the card under the pointer over the column behind it.
 *
 * Every column is a droppable covering its whole height, so plain
 * closestCorners keeps resolving to the column — which meant a card dropped
 * inside its own column always landed at the bottom instead of where it was
 * aimed. Ranking card collisions first is what makes reordering work.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);

  const cardCollision = collisions.find(
    (collision) => collision.data?.droppableContainer?.data?.current?.type === 'card'
  );

  return cardCollision ? [cardCollision] : collisions;
};

interface BoardPageProps {
  /** Which plan's board to render. Omitted → the organization's default. */
  planId?: string;
  /** Shown in the topbar; defaults to "Board" for the default-plan route. */
  planName?: string;
}

export function BoardPage({ planId, planName }: BoardPageProps = {}) {
  const {
    board,
    loading,
    error,
    refetch,
    previewMove,
    commitMove,
    addTask,
    addTaskFromTemplate,
    addGroup,
    updateGroup,
    reorderGroups,
    deleteGroup,
    toggleSubtask,
    applyTaskUpdate,
  } = useBoard(planId);
  // Feeds the breadcrumb; the sidebar has the same data loaded already.
  const { planGroups, plans } = usePlanNav();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  // Two pieces of state on purpose. Unmounting a Radix Dialog in the same
  // commit that sets `open` to false skips its close sequence, which can leave
  // `pointer-events: none` on <body> — the whole app, sidebar included, then
  // ignores clicks. Keeping the panel mounted while it closes also restores
  // its slide-out animation.
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // Bumped on every open so the panel remounts. Without it, reopening the same
  // card reuses the old hook state — a subtask ticked from the board in the
  // meantime would not show, because taskId never changed and nothing
  // refetched. Remounting happens while the panel is closed, so it does not
  // bring back the unmount-while-open bug this split-state fixed.
  const [panelSession, setPanelSession] = useState(0);
  const [view, setView] = useState<BoardViewMode>('board');

  const handleToggleSubtask = useCallback(
    async (taskId: string, subtaskId: string, desiredIsDone: boolean) => {
      const ok = await toggleSubtask(taskId, subtaskId, desiredIsDone);
      if (!ok) toast.error('อัปเดตงานย่อยไม่สำเร็จ');
    },
    [toggleSubtask]
  );

  const openTaskPanel = useCallback((taskId: string) => {
    setPanelTaskId(taskId);
    setPanelSession((session) => session + 1);
    setPanelOpen(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // A refresh that fails once the board is on screen gets a toast; the Alert
  // below is reserved for the cold-load failure.
  const toastedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) {
      toastedErrorRef.current = null;
      return;
    }
    if (error === toastedErrorRef.current) return;
    toastedErrorRef.current = error;
    if (board) toast.error(error);
  }, [error, board]);

  // Cold load only — a background refresh must not unmount the board or the
  // task panel that may be open on top of it.
  if (loading && !board) return <BoardSkeleton />;

  if (!board) {
    return (
      <div className="px-5 py-6">
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

  /**
   * Where the dragged card should sit given what it is currently over.
   * Returns null when nothing would change.
   */
  const resolveDrop = (activeId: string, overId: string) => {
    const sourceGroup = board.groups.find((g) => g.taskItems.some((t) => t.id === activeId));
    if (!sourceGroup) return null;

    const overGroup =
      board.groups.find((g) => g.id === overId) ??
      board.groups.find((g) => g.taskItems.some((t) => t.id === overId));
    if (!overGroup) return null;

    let targetIndex = overGroup.taskItems.findIndex((t) => t.id === overId);
    if (targetIndex === -1) targetIndex = overGroup.taskItems.length;

    if (sourceGroup.id === overGroup.id) {
      const sourceIndex = sourceGroup.taskItems.findIndex((t) => t.id === activeId);
      if (sourceIndex === targetIndex) return null;
      // Removing the card from its own array first shifts every later index
      // left by one, so a forward move must target one slot earlier.
      if (sourceIndex < targetIndex) targetIndex -= 1;
      if (sourceIndex === targetIndex) return null;
    }

    return { groupId: overGroup.id, targetIndex };
  };

  // Reorder as the pointer moves so the other cards open a gap, rather than
  // everything jumping at the moment of the drop.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const drop = resolveDrop(activeId, overId);
    if (drop) previewMove(activeId, drop.groupId, drop.targetIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);

    const activeId = String(event.active.id);
    // handleDragOver already moved the card locally, so the board's current
    // state IS the intended result — persist that rather than recomputing
    // from the drop target.
    const group = board.groups.find((g) => g.taskItems.some((t) => t.id === activeId));
    if (!group) return;

    const targetIndex = group.taskItems.findIndex((t) => t.id === activeId);
    if (targetIndex === -1) return;

    void commitMove(activeId, group.id, targetIndex).then((ok) => {
      if (!ok) toast.error('ย้ายงานไม่สำเร็จ');
    });
  };

  const handleAddTask = async (groupId: string, title: string, priority?: TaskPriority) => {
    const ok = await addTask(groupId, title, priority);
    if (!ok) toast.error('Failed to add task');
  };

  const handleAddColumn = async (name: string, color?: GroupColorKey) => {
    const ok = await addGroup(name, color);
    if (!ok) toast.error('เพิ่มหัวข้อไม่สำเร็จ');
  };

  const handleRenameGroup = async (groupId: string, name: string) => {
    const ok = await updateGroup(groupId, { name });
    if (!ok) toast.error('เปลี่ยนชื่อหัวข้อไม่สำเร็จ');
    return ok;
  };

  const handleRecolorGroup = async (groupId: string, color: GroupColorKey) => {
    const ok = await updateGroup(groupId, { color });
    if (!ok) toast.error('เปลี่ยนสีหัวข้อไม่สำเร็จ');
  };

  const handleSetWipLimit = async (groupId: string, wipLimit: number | null) => {
    const ok = await updateGroup(groupId, { wipLimit });
    if (!ok) toast.error('ตั้งค่าจำนวนงานสูงสุดไม่สำเร็จ');
  };

  /** Swaps a column with its neighbour and sends the complete new ordering. */
  const handleMoveGroup = async (groupId: string, direction: -1 | 1) => {
    if (!board) return;
    const ids = board.groups.map((group) => group.id);
    const from = ids.indexOf(groupId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;

    [ids[from], ids[to]] = [ids[to], ids[from]];
    const ok = await reorderGroups(ids);
    if (!ok) toast.error('ย้ายหัวข้อไม่สำเร็จ');
  };

  const handleDeleteGroup = async (groupId: string, targetGroupId: string) => {
    const target = board?.groups.find((group) => group.id === targetGroupId);
    const result = await deleteGroup(groupId, targetGroupId);
    if (!result) {
      toast.error('ลบหัวข้อไม่สำเร็จ');
      return;
    }
    toast.success(
      result.movedTaskCount > 0
        ? `ย้าย ${result.movedTaskCount} งานไปที่ "${target?.name ?? 'หัวข้อปลายทาง'}" แล้ว`
        : 'ลบหัวข้อแล้ว'
    );
  };

  const totalTasks = board.groups.reduce((n, g) => n + g.taskItems.length, 0);
  const subtitle = `${totalTasks} task${totalTasks === 1 ? '' : 's'} · ${board.groups.length} column${board.groups.length === 1 ? '' : 's'}`;

  return (
    <div className="min-h-screen bg-surface-primary">
      <PlannerTopbar
        title={planName ?? 'Board'}
        subtitle={subtitle}
        breadcrumb={
          <PlannerBreadcrumb
            planGroups={planGroups}
            plans={plans}
            activeGroupId={
              plans.find((plan) => plan.id === board.planId)?.planGroupId ?? null
            }
            activePlanId={board.planId}
          />
        }
      />

      <div className="px-5 py-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <BoardViewSwitcher value={view} onChange={setView} />
          <TaskCreateMenu
            groups={board.groups}
            onAddTask={handleAddTask}
            onUseTemplate={addTaskFromTemplate}
          />
        </div>

        {view === 'board' && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {board.groups.map((group, index) => (
                <BoardColumn
                  key={group.id}
                  group={group}
                  siblings={board.groups.filter((g) => g.id !== group.id)}
                  canMoveLeft={index > 0}
                  canMoveRight={index < board.groups.length - 1}
                  onOpenTask={openTaskPanel}
                  onToggleSubtask={handleToggleSubtask}
                  onAddTask={handleAddTask}
                  onRenameGroup={handleRenameGroup}
                  onRecolorGroup={handleRecolorGroup}
                  onSetWipLimit={handleSetWipLimit}
                  onMoveGroup={handleMoveGroup}
                  onDeleteGroup={handleDeleteGroup}
                />
              ))}
              <AddColumnPopover onAddColumn={handleAddColumn} />
            </div>

            <DragOverlay>
              {activeTask ? <BoardTaskCard task={activeTask} onOpen={() => {}} overlay /> : null}
            </DragOverlay>
          </DndContext>
        )}

        {view === 'list' && <BoardListView board={board} onOpenTask={openTaskPanel} />}
        {view === 'calendar' && <BoardCalendarView board={board} onOpenTask={openTaskPanel} />}
        {view === 'timeline' && <BoardTimelineView board={board} onOpenTask={openTaskPanel} />}
      </div>

      {panelTaskId && (
        <TaskDetailModal
          key={panelSession}
          taskId={panelTaskId}
          // The board already loaded this card, subtasks included — handing it
          // over means the panel opens filled in rather than on a spinner.
          initialTask={board.groups
            .flatMap((group) => group.taskItems)
            .find((task) => task.id === panelTaskId)}
          open={panelOpen}
          onOpenChange={setPanelOpen}
          onTaskUpdated={applyTaskUpdate}
          onTaskDeleted={() => {
            setPanelOpen(false);
            void refetch();
          }}
          groups={board.groups}
        />
      )}
    </div>
  );
}
