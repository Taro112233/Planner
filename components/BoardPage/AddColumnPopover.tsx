// components/BoardPage/AddColumnPopover.tsx
// Trailing "+ เพิ่มหัวข้อใหม่" slot: name input plus the color palette.
'use client';

import React, { useState } from 'react';
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
    <div className="w-[266px] shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full rounded-lg bg-surface-tertiary px-2 py-[11px] text-center text-sm font-medium text-content-secondary transition-colors hover:bg-surface-interactive hover:text-content-primary"
          >
            ＋ เพิ่มหัวข้อใหม่
          </button>
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
      <p className="px-1 py-2 text-[11px] leading-relaxed text-content-tertiary">
        ดับเบิลคลิกชื่อหัวข้อเพื่อเปลี่ยนชื่อ · ⋯ เพื่อเปลี่ยนสีหรือลบ · ลากการ์ดข้ามหัวข้อได้
      </p>
    </div>
  );
}
