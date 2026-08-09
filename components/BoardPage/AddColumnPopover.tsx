// components/BoardPage/AddColumnPopover.tsx
// Small "+ Add column" trigger with a name input.
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AddColumnPopoverProps {
  onAddColumn: (name: string) => Promise<void>;
}

export function AddColumnPopover({ onAddColumn }: AddColumnPopoverProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAddColumn(trimmed);
      setName('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 shrink-0 border-dashed">
          <Plus size={16} className="mr-1.5" />
          Add column
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Column name"
            disabled={submitting}
          />
          <Button type="submit" className="w-full" size="sm" disabled={submitting || !name.trim()}>
            Create
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
