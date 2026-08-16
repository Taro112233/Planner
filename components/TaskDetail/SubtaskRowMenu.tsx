// components/TaskDetail/SubtaskRowMenu.tsx
// Per-row "..." action menu for a subtask (rename / delete / add nested
// child, when depth allows). Shared by TaskPage's full subtask tree and
// TaskDetailModal's slide-over tree via RecursiveSubtaskList's
// `renderNodeExtra` slot.
'use client';

import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SubtaskNodeDto } from '@/types/planner';

interface SubtaskRowMenuProps {
  subtask: SubtaskNodeDto;
  depth: number;
  disabled: boolean;
  onAddChild: (title: string) => void;
  onRename: (title: string) => void;
  onDeleteRequest: () => void;
}

export function SubtaskRowMenu({
  subtask,
  depth,
  disabled,
  onAddChild,
  onRename,
  onDeleteRequest,
}: SubtaskRowMenuProps) {
  const [mode, setMode] = useState<'menu' | 'rename' | 'add-child'>('menu');
  const [draft, setDraft] = useState('');

  const openRename = () => {
    setDraft(subtask.title);
    setMode('rename');
  };
  const openAddChild = () => {
    setDraft('');
    setMode('add-child');
  };
  const close = () => setMode('menu');

  const submit = () => {
    const title = draft.trim();
    if (!title) return close();
    if (mode === 'rename') onRename(title);
    if (mode === 'add-child') onAddChild(title);
    close();
  };

  if (mode !== 'menu') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-1.5"
      >
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => !draft.trim() && close()}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          placeholder={mode === 'rename' ? 'Rename subtask' : 'Subtask title'}
          disabled={disabled}
          className="h-7 text-xs w-40"
        />
        <Button type="submit" size="sm" className="h-7 px-2" disabled={disabled || !draft.trim()}>
          {mode === 'rename' ? 'Save' : 'Add'}
        </Button>
      </form>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${subtask.title}`}
          disabled={disabled}
          className="rounded p-1 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary"
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {depth < 2 && <DropdownMenuItem onSelect={openAddChild}>Add subtask</DropdownMenuItem>}
        <DropdownMenuItem onSelect={openRename}>Rename</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDeleteRequest}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
