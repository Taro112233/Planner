// components/BoardPage/NewTaskButton.tsx
// Topbar "+ New task" action — a small popover with a column picker and title
// input. Delegates to the same addTask mutation each column's own quick-add
// form uses; this is just a second entry point that doesn't require scrolling
// to a specific column first.
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BoardGroupDto } from '@/types/planner';

interface NewTaskButtonProps {
  groups: BoardGroupDto[];
  onAddTask: (groupId: string, title: string) => Promise<void>;
}

export function NewTaskButton({ groups, onAddTask }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !groupId || submitting) return;

    setSubmitting(true);
    try {
      await onAddTask(groupId, trimmed);
      setTitle('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (groups.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus size={15} className="mr-1" />
          New task
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Column" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            disabled={submitting}
          />
          <Button type="submit" className="w-full" size="sm" disabled={submitting || !title.trim()}>
            Create
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
