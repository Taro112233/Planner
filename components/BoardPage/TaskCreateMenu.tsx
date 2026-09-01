// components/BoardPage/TaskCreateMenu.tsx
// One control for everything that creates a card: a blank task, a task from a
// saved template, or managing the templates themselves.
//
//   [ สร้าง task ใหม่หรือ template  + ]
//
// Replaces the old pair of buttons (New task + a caret) — they did the same
// job and split the choice across two targets.
'use client';

import React, { useEffect, useState } from 'react';
import { FilePlus2, Loader2, Plus, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PriorityChipRow } from '@/components/TaskDetail';
import { useTaskTemplates } from '@/hooks/useTaskTemplates';
import { TemplateSubtaskEditor } from './TemplateSubtaskEditor';
import type { BoardGroupDto, TaskPriority, TaskTemplateNode } from '@/types/planner';

interface TaskCreateMenuProps {
  groups: BoardGroupDto[];
  onAddTask: (groupId: string, title: string, priority?: TaskPriority) => Promise<void>;
  /** Creates the card from a saved shape; resolves false on failure. */
  onUseTemplate: (groupId: string, templateId: string) => Promise<boolean>;
}

/** Total nodes in a blueprint, for the "N งานย่อย" hint. */
function countNodes(nodes: TaskTemplateNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);
}

export function TaskCreateMenu({ groups, onAddTask, onUseTemplate }: TaskCreateMenuProps) {
  const { templates, createTemplate, deleteTemplate } = useTaskTemplates();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  // Blank-task dialog
  const [blankOpen, setBlankOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority | null>(null);
  const [creating, setCreating] = useState(false);

  // Template manager dialog
  const [managerOpen, setManagerOpen] = useState(false);
  const [name, setName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templatePriority, setTemplatePriority] = useState<TaskPriority | null>(null);
  const [checklist, setChecklist] = useState<TaskTemplateNode[]>([]);
  const [saving, setSaving] = useState(false);

  // Each visit starts clean: a half-written draft from last time reads as a
  // bug, not a convenience.
  useEffect(() => {
    if (!managerOpen) return;
    setName('');
    setTemplateTitle('');
    setTemplatePriority(null);
    setChecklist([]);
  }, [managerOpen]);

  useEffect(() => {
    if (!blankOpen) return;
    setTitle('');
    setPriority(null);
  }, [blankOpen]);

  const targetGroupId = groupId || groups[0]?.id || '';

  const handleCreateBlank = async () => {
    const trimmed = title.trim();
    if (!trimmed || !targetGroupId || creating) return;

    setCreating(true);
    try {
      await onAddTask(targetGroupId, trimmed, priority ?? undefined);
      setBlankOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    if (!targetGroupId) return;

    setPendingTemplateId(templateId);
    try {
      const ok = await onUseTemplate(targetGroupId, templateId);
      if (!ok) toast.error('สร้างงานจากเทมเพลตไม่สำเร็จ');
    } finally {
      setPendingTemplateId(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!name.trim() || !templateTitle.trim() || saving) return;

    setSaving(true);
    try {
      const ok = await createTemplate({
        name: name.trim(),
        title: templateTitle.trim(),
        priority: templatePriority ?? undefined,
        subtasks: checklist,
      });
      if (!ok) {
        toast.error('บันทึกเทมเพลตไม่สำเร็จ — ชื่ออาจซ้ำ');
        return;
      }
      toast.success('บันทึกเทมเพลตแล้ว');
      setName('');
      setTemplateTitle('');
      setTemplatePriority(null);
      setChecklist([]);
    } finally {
      setSaving(false);
    }
  };

  if (groups.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="shrink-0 gap-2">
            New Task/Template
            <Plus size={15} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {/* Which column everything below lands in. */}
          <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
            หัวข้อปลายทาง
          </DropdownMenuLabel>
          <div className="px-2 pb-2" onKeyDown={(event) => event.stopPropagation()}>
            <Select value={targetGroupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="เลือกหัวข้อ" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuItem onSelect={() => setTimeout(() => setBlankOpen(true), 0)}>
            <FilePlus2 size={13} />
            สร้าง task เปล่า
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
            จากเทมเพลต
          </DropdownMenuLabel>

          {templates.length === 0 && <DropdownMenuItem disabled>ยังไม่มีเทมเพลต</DropdownMenuItem>}

          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              disabled={pendingTemplateId !== null}
              onSelect={(event) => {
                event.preventDefault();
                void handleUseTemplate(template.id);
              }}
            >
              <span className="min-w-0 flex-1 truncate">{template.name}</span>
              {pendingTemplateId === template.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                template.subtasks.length > 0 && (
                  <span className="text-[10px] text-content-tertiary">
                    {countNodes(template.subtasks)} งานย่อย
                  </span>
                )
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setTimeout(() => setManagerOpen(true), 0)}>
            <Settings2 size={13} />
            จัดการเทมเพลต
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Blank task ─────────────────────────────────────────────── */}
      <Dialog open={blankOpen} onOpenChange={setBlankOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้าง task ใหม่</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={targetGroupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="หัวข้อ" />
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
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreateBlank();
              }}
              placeholder="ชื่องาน"
              disabled={creating}
            />

            <div className="space-y-1.5">
              <p className="text-xs text-content-tertiary">ความสำคัญ</p>
              <PriorityChipRow value={priority} onChange={setPriority} disabled={creating} />
            </div>

            <Button
              className="w-full"
              size="sm"
              onClick={handleCreateBlank}
              disabled={creating || !title.trim()}
            >
              สร้าง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Template manager ───────────────────────────────────────── */}
      <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เทมเพลตงาน</DialogTitle>
            <DialogDescription>
              กำหนดงานและงานย่อยให้ครบก่อน แล้วกดบันทึก — เทมเพลตจะยังไม่ถูกสร้างจนกว่าจะกด
            </DialogDescription>
          </DialogHeader>

          {templates.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-secondary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-content-primary">
                      {template.name}
                    </span>
                    <span className="block truncate text-[11px] text-content-tertiary">
                      {template.title}
                      {template.subtasks.length > 0 &&
                        ` · ${countNodes(template.subtasks)} งานย่อย`}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-content-tertiary hover:text-content-danger"
                    aria-label={`ลบเทมเพลต ${template.name}`}
                    onClick={async () => {
                      const ok = await deleteTemplate(template.id);
                      if (!ok) toast.error('ลบเทมเพลตไม่สำเร็จ');
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Not a <form>: the checklist editor below contains its own form for
              adding a row, and nesting forms is invalid HTML — the browser
              drops the inner one, so pressing Enter there would submit this
              dialog and reload the page. */}
          <div className="space-y-4 border-t border-border-subtle pt-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ชื่อเทมเพลต เช่น งานออกแบบ"
              disabled={saving}
            />

            <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-secondary">
              <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="w-24 shrink-0 text-xs text-content-tertiary">ชื่องาน</span>
                <Input
                  value={templateTitle}
                  onChange={(event) => setTemplateTitle(event.target.value)}
                  placeholder="ชื่องานที่จะถูกสร้าง"
                  disabled={saving}
                  className="h-8"
                />
              </div>

              <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                <span className="w-24 shrink-0 pt-1 text-xs text-content-tertiary">ความสำคัญ</span>
                <div className="min-w-0 flex-1">
                  <PriorityChipRow
                    value={templatePriority}
                    onChange={setTemplatePriority}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <section aria-label="งานย่อยของเทมเพลต">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                Subtasks
              </h3>
              <TemplateSubtaskEditor nodes={checklist} onChange={setChecklist} />
            </section>

            <Button
              className="w-full"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={saving || !name.trim() || !templateTitle.trim()}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              บันทึกเทมเพลต
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
