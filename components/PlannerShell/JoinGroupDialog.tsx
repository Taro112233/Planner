// components/PlannerShell/JoinGroupDialog.tsx
// Redeem a group invite code, the way you join a team in MS Teams. The code
// alone says which workspace you are joining, so nothing else is asked for.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@/hooks/useMutation';
import type { PlanGroupJoinResultDto } from '@/types/planner';

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful join so the nav can pick up the new group. */
  onJoined: (result: PlanGroupJoinResultDto) => void;
}

export function JoinGroupDialog({ open, onOpenChange, onJoined }: JoinGroupDialogProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { mutate } = useMutation<PlanGroupJoinResultDto>();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const result = await mutate<{ code: string }>('/api/plan-groups/join', {
        method: 'POST',
        body: { code: trimmed },
      });
      if (!result) {
        // useMutation already logged the reason; the message is server-worded.
        toast.error('เข้ากลุ่มไม่สำเร็จ — ตรวจรหัสอีกครั้ง');
        return;
      }

      // The group lives in the owner's workspace, so switch into it — without
      // this the user joins something they cannot see.
      await mutate<{ organizationId: string }>('/api/workspaces/active', {
        method: 'POST',
        body: { organizationId: result.organizationId },
      });

      toast.success(
        result.alreadyMember
          ? `คุณอยู่ในกลุ่ม "${result.planGroupName}" อยู่แล้ว`
          : `เข้ากลุ่ม "${result.planGroupName}" แล้ว`
      );
      setCode('');
      onOpenChange(false);
      onJoined(result);
      router.replace(`/groups/${result.planGroupId}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เข้าร่วมกลุ่มด้วยรหัส</DialogTitle>
          <DialogDescription>
            ขอรหัสจากเจ้าของกลุ่ม พิมพ์ตัวพิมพ์เล็กหรือใหญ่ก็ได้
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="เช่น K3F8-QPMR"
            disabled={submitting}
            className="text-center font-mono tracking-[0.2em] uppercase"
          />
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={submitting || !code.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  กำลังเข้ากลุ่ม…
                </>
              ) : (
                <>
                  <LogIn className="size-3.5" />
                  เข้าร่วมกลุ่ม
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
