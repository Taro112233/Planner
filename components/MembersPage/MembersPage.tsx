// components/MembersPage/MembersPage.tsx
// "สมาชิก & สิทธิ์" — one card per workspace role with who holds it, the
// roster (role changeable where the rules allow), and a read-only matrix of
// what each role can do.
'use client';

import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerPageSkeleton, PlannerTopbar } from '@/components/PlannerShell';
import { useApiResource } from '@/hooks/useApiResource';
import { useMutation } from '@/hooks/useMutation';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { WORKSPACE_ROLE_LABELS, type AssignableRole } from '@/lib/shared/member-roles';
import type { WorkspaceMemberDto } from '@/types/planner';
import { MembersRoleCards } from './MembersRoleCards';
import { MembersTable } from './MembersTable';
import { MembersPermissionMatrix } from './MembersPermissionMatrix';
import type { MembersPayload } from './types';

export function MembersPage() {
  const { scopeQuery, scopeGroup } = usePlannerScope();
  const { data, loading, error, setData } = useApiResource<MembersPayload>(
    scopeQuery ? `/api/members?${scopeQuery}` : '/api/members'
  );
  const { mutate } = useMutation();

  if (loading && !data) return <PlannerPageSkeleton />;

  const handleRoleChange = async (member: WorkspaceMemberDto, role: AssignableRole) => {
    const previous = data;
    // Optimistic: the select and the role cards move at once.
    setData((current) =>
      current
        ? {
            ...current,
            members: current.members.map((m) =>
              m.organizationUserId === member.organizationUserId ? { ...m, role } : m
            ),
          }
        : current
    );

    const result = await mutate(`/api/members/${member.organizationUserId}/role`, {
      method: 'PATCH',
      body: { role },
    });
    if (result) {
      toast.success(`${member.name} เป็น${WORKSPACE_ROLE_LABELS[role]}แล้ว`);
    } else {
      setData(previous);
      toast.error('เปลี่ยนสิทธิ์ไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar
        showScope
        title="สมาชิก & สิทธิ์การเข้าใช้"
        subtitle={
          data
            ? `${data.members.length} คน${scopeGroup ? 'ในกลุ่มนี้' : 'ในเวิร์กสเปซนี้'}`
            : undefined
        }
      />

      <div className="space-y-4 px-5 pb-6 pt-1">
        {!data ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error ?? 'โหลดรายชื่อสมาชิกไม่สำเร็จ'}</AlertDescription>
          </Alert>
        ) : (
          <>
            <MembersRoleCards members={data.members} />
            <MembersTable
              members={data.members}
              viewer={data.viewer}
              onRoleChange={handleRoleChange}
              groupScoped={Boolean(scopeGroup)}
            />
            <MembersPermissionMatrix />
            <p className="text-[11.5px] text-content-tertiary">
              สิทธิ์ของคุณในเวิร์กสเปซ: {WORKSPACE_ROLE_LABELS[data.viewer.role]} ·{' '}
              {scopeGroup
                ? 'บทบาทในเวิร์กสเปซแก้ได้เมื่อเลือก Workspace ของฉัน'
                : 'เชิญคนใหม่ได้ด้วยรหัสเข้าร่วมในหน้ากลุ่ม'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
