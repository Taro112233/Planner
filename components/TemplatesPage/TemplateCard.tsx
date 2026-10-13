// components/TemplatesPage/TemplateCard.tsx
// One template: icon tile, name, description, its columns as chips, and
// "ใช้เทมเพลตนี้", which opens a small form for the new plan's name and group.
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import type { PlanTemplate } from '@/lib/shared/plan-templates';
import type { PlanGroupDto } from '@/types/planner';

const PERSONAL = 'personal';

interface TemplateCardProps {
  template: PlanTemplate;
  planGroups: PlanGroupDto[];
  /** The group in scope, preselected as where the new plan goes. */
  defaultGroupId: string | null;
  /** Resolves true when the plan was created. */
  onUse: (name: string, planGroupId: string | null) => Promise<boolean>;
}

export function TemplateCard({ template, planGroups, defaultGroupId, onUse }: TemplateCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [groupId, setGroupId] = useState(PERSONAL);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onUse(trimmed, groupId === PERSONAL ? null : groupId);
      if (ok) setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wcard px-4 py-3.5">
      <div className="flex items-center gap-[9px]">
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-[13px] text-white"
          style={{ backgroundColor: resolveGroupColor(template.color) }}
          aria-hidden="true"
        >
          {template.icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[14.5px] font-semibold text-content-primary">{template.name}</span>
          <span className="block text-[11.5px] text-content-tertiary">{template.description}</span>
        </span>
      </div>

      <div className="my-3 flex flex-wrap gap-[7px]">
        {template.columns.map((column) => (
          <span
            key={column.name}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-2.5 py-[3px] text-[11px] text-content-secondary"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: resolveGroupColor(column.color) }}
            />
            {column.name}
          </span>
        ))}
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ชื่อแผนงานใหม่"
            maxLength={60}
            disabled={submitting}
            aria-label="ชื่อแผนงานใหม่"
          />
          <Select value={groupId} onValueChange={setGroupId} disabled={submitting}>
            <SelectTrigger className="h-9 text-sm" aria-label="สร้างไว้ในกลุ่ม">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PERSONAL}>แผนงานส่วนตัว (ไม่อยู่ในกลุ่ม)</SelectItem>
              {planGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  กลุ่ม {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !name.trim()} className="flex-1">
              สร้างแผนงาน
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          className="font-semibold"
          onClick={() => {
            setGroupId(defaultGroupId ?? PERSONAL);
            setOpen(true);
          }}
        >
          ใช้เทมเพลตนี้
        </Button>
      )}
    </div>
  );
}
