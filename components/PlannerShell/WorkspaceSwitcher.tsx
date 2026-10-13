// components/PlannerShell/WorkspaceSwitcher.tsx
// The footer chip from the mockup (avatar + name + role + ⇅). Opens the
// account menu: the workspace picker (you get your own workspace on sign-in
// and pick up others by redeeming a group join code), settings — where the
// theme is chosen — profile, and sign-out.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
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
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { invalidateApiResource, useApiResource } from '@/hooks/useApiResource';
import { usePlanNav } from '@/hooks/usePlanNav';
import { usePlannerScope } from '@/hooks/usePlannerScope';
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
  // Shared, cached copy — the board reads the same endpoint for "mine".
  const { data: payload, refetch: reloadWorkspaces } =
    useApiResource<WorkspacesPayload>('/api/workspaces');
  const workspaces = payload?.workspaces ?? [];
  const activeId = payload?.activeOrganizationId ?? null;
  const [switching, setSwitching] = useState<string | null>(null);
  const { mutate } = useMutation<WorkspaceDto>();
  const router = useRouter();
  const { logout, isAdmin } = useCurrentUser();
  const { refetch: reloadNav } = usePlanNav();
  const { setScopeGroupId } = usePlannerScope();

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

      toast.success(`สลับไปที่ "${result.name}" แล้ว`);
      // The shell stays mounted across pages, so everything cached belongs to
      // the old workspace: drop it, reload the nav, and leave the old scope.
      invalidateApiResource();
      setScopeGroupId(null);
      await Promise.all([reloadWorkspaces(), reloadNav()]);
      router.replace('/home');
      router.refresh();
    } finally {
      setSwitching(null);
    }
  };

  const active = workspaces.find((workspace) => workspace.organizationId === activeId);
  const hasChoice = workspaces.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full rounded-lg bg-surface-tertiary/60 text-left transition-colors hover:bg-surface-interactive"
          aria-label="เมนูบัญชี"
        >
          <div className="flex w-full items-center gap-2.5 px-2 py-[7px]">
            <Avatar className="size-[26px]">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[12.5px] font-medium text-content-primary">{userName}</p>
              <p className="truncate text-[10.5px] text-content-tertiary">
                {active ? active.name : userRole}
              </p>
            </div>
            <ChevronsUpDown
              size={13}
              className="shrink-0 text-content-tertiary group-data-[collapsible=icon]:hidden"
            />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        {hasChoice && (
          <>
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
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings size={14} />
            ตั้งค่า & ธีม
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User size={14} />
            โปรไฟล์
          </Link>
        </DropdownMenuItem>
        {/* Site-wide admin (UserRole), not the workspace role. */}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck size={14} />
              จัดการผู้ใช้ทั้งระบบ
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logout();
          }}
        >
          <LogOut size={14} />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
