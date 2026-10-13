// components/AuditLogPage/AuditLogPage.tsx
// "ประวัติตรวจสอบ" — every recorded action in the workspace, newest first.
// Owners and admins only; the API answers 403 for everyone else.
'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlannerTopbar } from '@/components/PlannerShell';
import { PaginationBar } from '@/components/AdminPage/PaginationBar';
import { EmptyState } from '@/components/shared';
import { useDataList } from '@/hooks/useDataList';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import type { AuditCategory, AuditEntryDto } from '@/types/planner';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogPageSkeleton } from './AuditLogPageSkeleton';

const PAGE_SIZE = 25;

/** Matches AUDIT_FORBIDDEN in services/audit.service.ts. */
const FORBIDDEN_MESSAGE = 'Audit log requires an owner or admin';

export function AuditLogPage() {
  const { scopeGroupId } = usePlannerScope();
  const { items, pagination, loading, error, filters, setFilters } = useDataList<AuditEntryDto>(
    '/api/audit',
    { page: 1, limit: PAGE_SIZE, category: 'all', planGroupId: scopeGroupId ?? undefined }
  );
  // Follow the group in scope (it resolves after mount, and can change).
  useEffect(() => {
    if ((filters.planGroupId ?? null) !== scopeGroupId) {
      setFilters({ planGroupId: scopeGroupId ?? undefined });
    }
  }, [scopeGroupId, filters.planGroupId, setFilters]);
  const { members } = useOrganizationMembers();

  const category = (filters.category as AuditCategory | undefined) ?? 'all';
  const actorId = (filters.actorId as string | undefined) || null;

  const exportParams = new URLSearchParams({ format: 'csv', category });
  if (actorId) exportParams.set('actorId', actorId);
  if (scopeGroupId) exportParams.set('planGroupId', scopeGroupId);

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar showScope title="ประวัติการตรวจสอบ" subtitle="บันทึกทุกการกระทำ — ใคร ทำอะไร เมื่อไร" />

      <div className="space-y-3 px-5 py-5">
        {error === FORBIDDEN_MESSAGE ? (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              ประวัติการตรวจสอบเปิดให้เฉพาะเจ้าของและผู้ดูแลเวิร์กสเปซ
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <AuditLogFilters
              category={category}
              actorId={actorId}
              members={members}
              exportHref={`/api/audit?${exportParams.toString()}`}
              onCategoryChange={(next) => setFilters({ category: next })}
              onActorChange={(next) => setFilters({ actorId: next ?? undefined })}
            />

            {error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading && items.length === 0 ? (
              <AuditLogPageSkeleton />
            ) : items.length === 0 ? (
              <EmptyState title="ยังไม่มีบันทึกที่ตรงกับตัวกรอง" />
            ) : (
              <AuditLogTable items={items} />
            )}

            {pagination && (
              <PaginationBar pagination={pagination} onPageChange={(page) => setFilters({ page })} />
            )}

            <p className="text-[11px] text-content-tertiary">
              บันทึกการติ๊กงาน การย้ายสถานะ การเพิ่ม/ลบหัวข้อ และการจัดการแผนงาน · ลบไม่ได้ แก้ไม่ได้
            </p>
          </>
        )}
      </div>
    </div>
  );
}
