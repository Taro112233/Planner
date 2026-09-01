// components/PlannerShell/WorkspaceSwitcher.tsx
// The footer chip from the mockup (avatar + name + role + ⇅), extended into a
// workspace picker: you get your own workspace on sign-in and pick up others
// by redeeming a group join code, so this is how you reach them.
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation } from '@/hooks/useMutation';
import type { WorkspaceDto } from '@/types/planner';

interface WorkspaceSwitcherProps {
  userName: string;
  userRole: string;
  userImage?: string | null;
  initials: string;
}

interface WorkspacesPayload {
  workspaces: WorkspaceDto[];
  activeOrganizationId: string;
}

export function WorkspaceSwitcher({
  userName,
  userRole,
  userImage,
  initials,
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const { mutate } = useMutation<WorkspaceDto>();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data.success) return;

      const payload = data.data as WorkspacesPayload;
      setWorkspaces(payload.workspaces);
      setActiveId(payload.activeOrganizationId);
    } catch {
      // The chip still renders the user; a failed list just means no picker.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeId) return;

    setSwitching(organizationId);
    try {
      const result = await mutate<{ organizationId: string }>('/api/workspaces/active', {
        method: 'POST',
        body: { organizationId },
      });
      if (!result) {
        toast.error('สลับเวิร์กสเปซไม่สำเร็จ');
        return;
      }

      setActiveId(organizationId);
      toast.success(`สลับไปที่ "${result.name}" แล้ว`);
      // Every planner query is scoped to the workspace, so send the user to a
      // route that re-resolves everything rather than patching each cache.
      router.replace('/board');
      router.refresh();
    } finally {
      setSwitching(null);
    }
  };

  const active = workspaces.find((workspace) => workspace.organizationId === activeId);
  // With a single workspace there is nothing to switch to — render the plain
  // chip the sidebar had before.
  const hasChoice = workspaces.length > 1;

  const chip = (
    <div className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left">
      <Avatar size="sm">
        {userImage && <AvatarImage src={userImage} alt={userName} />}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-xs font-medium text-content-primary">{userName}</p>
        <p className="truncate text-[10px] text-content-tertiary">
          {active ? active.name : userRole}
        </p>
      </div>
      {hasChoice && (
        <ChevronsUpDown
          size={13}
          className="shrink-0 text-content-tertiary group-data-[collapsible=icon]:hidden"
        />
      )}
    </div>
  );

  if (!hasChoice) return chip;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full rounded-md hover:bg-surface-interactive" aria-label="สลับเวิร์กสเปซ">
          {chip}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="text-[11px] font-normal text-content-tertiary">
          เวิร์กสเปซของคุณ
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.organizationId}
            disabled={switching !== null}
            onSelect={(event) => {
              event.preventDefault();
              void handleSwitch(workspace.organizationId);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            <span className="text-[10px] text-content-tertiary">{workspace.role}</span>
            {switching === workspace.organizationId ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              workspace.organizationId === activeId && <Check size={13} />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-normal text-content-tertiary">
          เข้าร่วมกลุ่มด้วยรหัสเพื่อเพิ่มเวิร์กสเปซ
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
