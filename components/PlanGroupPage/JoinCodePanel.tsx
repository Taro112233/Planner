// components/PlanGroupPage/JoinCodePanel.tsx
// Owner-side controls for a group's invite code: generate/re-issue it, copy
// it, and open or close joining without changing the code.
'use client';

import React, { useState } from 'react';
import { Copy, KeyRound, Link as LinkIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@/hooks/useMutation';
import type { PlanGroupJoinSettingsDto } from '@/types/planner';

interface JoinCodePanelProps {
  planGroupId: string;
  settings: PlanGroupJoinSettingsDto | null;
  onChange: (settings: PlanGroupJoinSettingsDto) => void;
}

export function JoinCodePanel({ planGroupId, settings, onChange }: JoinCodePanelProps) {
  const [pending, setPending] = useState<'generate' | 'toggle' | null>(null);
  const { mutate } = useMutation<PlanGroupJoinSettingsDto>();

  const handleGenerate = async () => {
    setPending('generate');
    try {
      const next = await mutate(`/api/plan-groups/${planGroupId}/join-code`, { method: 'POST' });
      if (!next) {
        toast.error('สร้างรหัสไม่สำเร็จ');
        return;
      }
      onChange(next);
      toast.success(settings?.joinCode ? 'สร้างรหัสใหม่แล้ว — รหัสเดิมใช้ไม่ได้' : 'สร้างรหัสแล้ว');
    } finally {
      setPending(null);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setPending('toggle');
    try {
      const next = await mutate<{ enabled: boolean }>(
        `/api/plan-groups/${planGroupId}/join-code`,
        { method: 'PATCH', body: { enabled } }
      );
      if (!next) {
        toast.error('เปลี่ยนสถานะการเข้ากลุ่มไม่สำเร็จ');
        return;
      }
      onChange(next);
    } finally {
      setPending(null);
    }
  };

  const handleCopy = async (asLink = false) => {
    if (!settings?.joinCode) return;
    const value = asLink
      ? `${window.location.origin}/join/${settings.joinCode}`
      : settings.joinCode;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(asLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกรหัสแล้ว');
    } catch {
      // Clipboard access can be denied (insecure context, permissions) — the
      // code is on screen either way.
      toast.error('คัดลอกไม่สำเร็จ — คัดลอกด้วยมือได้เลย');
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <div className="flex items-center gap-2">
        <KeyRound size={14} className="text-content-tertiary" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
          รหัสเข้ากลุ่ม
        </h2>
      </div>

      {settings?.joinCode ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-surface-tertiary px-3 py-1.5 font-mono text-base tracking-[0.2em] text-content-primary">
            {settings.joinCode}
          </code>
          <Button variant="outline" size="sm" onClick={() => handleCopy(false)}>
            <Copy className="size-3.5" />
            คัดลอกรหัส
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCopy(true)}>
            <LinkIcon className="size-3.5" />
            คัดลอกลิงก์
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-content-tertiary">ยังไม่มีรหัส — กดสร้างเพื่อเชิญสมาชิก</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-content-secondary">
          <Switch
            checked={settings?.joinCodeEnabled ?? false}
            disabled={pending !== null || !settings?.joinCode}
            onCheckedChange={handleToggle}
            aria-label="เปิดรับสมาชิกใหม่"
          />
          {settings?.joinCodeEnabled ? 'เปิดรับสมาชิกใหม่' : 'ปิดรับสมาชิกใหม่'}
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={pending !== null}
        >
          {pending === 'generate' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {settings?.joinCode ? 'สร้างรหัสใหม่' : 'สร้างรหัส'}
        </Button>
      </div>

      {settings?.joinCode && !settings.joinCodeEnabled && (
        <p className="mt-2 text-[11px] text-content-tertiary">
          ตอนนี้ปิดรับอยู่ — คนที่มีรหัสจะเข้ากลุ่มไม่ได้จนกว่าจะเปิด
        </p>
      )}
    </div>
  );
}
