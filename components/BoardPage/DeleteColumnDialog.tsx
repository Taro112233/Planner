// components/BoardPage/DeleteColumnDialog.tsx
// Confirms deleting a column. Not ConfirmDeleteModal: that one takes plain
// strings and has no slot for the target-column picker this flow requires.
//
// Why a picker at all — TaskItem.group is `onDelete: Cascade`, so dropping a
// column would hard-delete its cards (trashed ones included). The cards must
// land somewhere first.
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BoardGroupDto, GroupSettingsDto } from '@/types/planner';

interface DeleteColumnDialogProps {
  open: boolean;
  group: BoardGroupDto;
  /** Sibling columns only — the source is excluded by the caller. */
  targets: GroupSettingsDto[];
  onConfirm: (targetGroupId: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteColumnDialog({
  open,
  group,
  targets,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteColumnDialogProps) {
  const [targetId, setTargetId] = useState<string>('');

  // Default to the nearest sibling each time the dialog opens.
  useEffect(() => {
    if (open) setTargetId(targets[0]?.id ?? '');
  }, [open, targets]);

  const taskCount = group.taskItems.length;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบหัวข้อ &ldquo;{group.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `งาน ${taskCount} รายการจะถูกย้ายไปที่หัวข้อที่เลือก (รวมงานที่อยู่ในถังขยะ — เมื่อกู้คืนจะไปอยู่ที่หัวข้อใหม่) แล้วหัวข้อนี้จะถูกลบถาวร`
              : 'หัวข้อนี้ไม่มีงานอยู่ และจะถูกลบถาวร'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-content-secondary" htmlFor="delete-column-target">
            ย้ายงานไปที่
          </label>
          <Select value={targetId} onValueChange={setTargetId} disabled={loading}>
            <SelectTrigger id="delete-column-target" className="w-full">
              <SelectValue placeholder="เลือกหัวข้อปลายทาง" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((target) => (
                <SelectItem key={target.id} value={target.id}>
                  {target.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(targetId)}
            disabled={loading || !targetId}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                กำลังลบ…
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                ลบหัวข้อ
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
