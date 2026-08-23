// components/BoardPage/BoardColumnMenu.tsx
// The column header's "⋯" menu: rename, recolor, WIP limit, add card, move
// left/right, delete.
'use client';

import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupColorSwatches } from './GroupColorSwatches';
import type { GroupColorKey } from '@/lib/shared/group-colors';
import type { BoardGroupDto } from '@/types/planner';

interface BoardColumnMenuProps {
  group: BoardGroupDto;
  taskCount: number;
  /** The board's only column — deleting it would leave no place for cards. */
  isOnlyColumn: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRenameRequest: () => void;
  onColorPick: (color: GroupColorKey) => void;
  onWipLimitCommit: (wipLimit: number | null) => void;
  onAddCardRequest: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDeleteRequest: () => void;
  disabled?: boolean;
}

export function BoardColumnMenu({
  group,
  taskCount,
  isOnlyColumn,
  canMoveLeft,
  canMoveRight,
  onRenameRequest,
  onColorPick,
  onWipLimitCommit,
  onAddCardRequest,
  onMoveLeft,
  onMoveRight,
  onDeleteRequest,
  disabled = false,
}: BoardColumnMenuProps) {
  const [open, setOpen] = useState(false);
  const [wipDraft, setWipDraft] = useState(group.wipLimit?.toString() ?? '');

  // Re-sync each time the menu opens; while it is closed the server value may
  // have changed underneath.
  useEffect(() => {
    if (open) setWipDraft(group.wipLimit?.toString() ?? '');
  }, [open, group.wipLimit]);

  const commitWip = () => {
    const trimmed = wipDraft.trim();
    const next = trimmed === '' ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 1)) {
      setWipDraft(group.wipLimit?.toString() ?? '');
      return;
    }
    if (next === (group.wipLimit ?? null)) return;
    onWipLimitCommit(next);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-content-tertiary hover:text-content-primary"
          aria-label={`ตัวเลือกของหัวข้อ ${group.name}`}
          disabled={disabled}
        >
          <MoreHorizontal size={14} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() => {
            // Let the menu close first, or the input mounts and is immediately
            // blurred by Radix returning focus to the trigger.
            setTimeout(onRenameRequest, 0);
          }}
        >
          <Pencil size={14} />
          เปลี่ยนชื่อหัวข้อ
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Interactive children must NOT be DropdownMenuItems: selecting an
            item closes the menu, and the menu's typeahead swallows keystrokes
            meant for the input — hence the plain divs and stopPropagation. */}
        <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
          สีของหัวข้อ
        </DropdownMenuLabel>
        <div
          className="px-2 pb-2"
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <GroupColorSwatches value={group.color} onChange={onColorPick} disabled={disabled} />
        </div>

        <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
          จำกัดจำนวนงาน (WIP)
        </DropdownMenuLabel>
        <div className="px-2 pb-2" onKeyDown={(e) => e.stopPropagation()} role="presentation">
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={wipDraft}
            placeholder="ไม่จำกัด"
            aria-label="จำกัดจำนวนงาน"
            disabled={disabled}
            onChange={(e) => setWipDraft(e.target.value)}
            onBlur={commitWip}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitWip();
                setOpen(false);
              }
            }}
            className="h-7 text-xs"
          />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => setTimeout(onAddCardRequest, 0)}>
          <Plus size={14} />
          เพิ่มการ์ดในหัวข้อนี้
        </DropdownMenuItem>

        <DropdownMenuItem disabled={!canMoveLeft} onSelect={onMoveLeft}>
          <ArrowLeft size={14} />
          ย้ายไปทางซ้าย
        </DropdownMenuItem>

        <DropdownMenuItem disabled={!canMoveRight} onSelect={onMoveRight}>
          <ArrowRight size={14} />
          ย้ายไปทางขวา
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isOnlyColumn}
          onSelect={() => setTimeout(onDeleteRequest, 0)}
        >
          <Trash2 size={14} />
          {isOnlyColumn ? 'ลบหัวข้อไม่ได้ (เหลือหัวข้อเดียว)' : `ลบหัวข้อ (${taskCount} งาน)…`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
