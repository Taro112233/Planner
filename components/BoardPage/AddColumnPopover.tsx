// components/BoardPage/AddColumnPopover.tsx
// Trailing "+ เพิ่มหัวข้อใหม่" slot: name input plus the color palette.
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GroupColorSwatches } from './GroupColorSwatches';
import type { GroupColorKey } from '@/lib/shared/group-colors';

interface AddColumnPopoverProps {
  onAddColumn: (name: string, color?: GroupColorKey) => Promise<void>;
}

export function AddColumnPopover({ onAddColumn }: AddColumnPopoverProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<GroupColorKey>('slate');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAddColumn(trimmed, color);
      setName('');
      setColor('slate');
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
          เพิ่มหัวข้อใหม่
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อหัวข้อใหม่"
            disabled={submitting}
          />
          <GroupColorSwatches value={color} onChange={setColor} disabled={submitting} />
          <Button type="submit" className="w-full" size="sm" disabled={submitting || !name.trim()}>
            เพิ่มหัวข้อ
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
