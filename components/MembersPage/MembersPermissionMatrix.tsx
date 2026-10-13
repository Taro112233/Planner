// components/MembersPage/MembersPermissionMatrix.tsx
// Read-only table of what each workspace role can do. The mockup's toggles
// need a configurable permission model, which is deferred; this shows the
// rules the code enforces today.
'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import {
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLE_LABELS,
  type WorkspaceRole,
} from '@/lib/shared/member-roles';

const ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
const GRID = 'grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] items-center gap-2';

export function MembersPermissionMatrix() {
  return (
    <section aria-label="ตารางสิทธิ์การเข้าใช้" className="wcard overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border-subtle px-4 py-3">
        <h2 className="text-[12.5px] font-semibold text-content-secondary">ตารางสิทธิ์การเข้าใช้</h2>
        <span className="text-[11.5px] text-content-tertiary">สิทธิ์ตามบทบาทในเวิร์กสเปซ</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          <div
            className={`${GRID} bg-surface-secondary px-4 py-2.5 text-[11px] font-semibold text-content-tertiary`}
          >
            <span>สิทธิ์</span>
            {ROLES.map((role) => (
              <span key={role} className="text-center">
                {WORKSPACE_ROLE_LABELS[role]}
              </span>
            ))}
          </div>

          {WORKSPACE_PERMISSIONS.map((permission) => (
            <div key={permission.label} className={`${GRID} border-t border-border-subtle px-4 py-2.5`}>
              <span className="text-[13px] text-content-primary">
                {permission.label}
                <span className="block text-[10.5px] text-content-tertiary">{permission.hint}</span>
              </span>
              {ROLES.map((role) => (
                <span key={role} className="flex justify-center">
                  {permission.roles[role] ? (
                    <span className="flex size-[21px] items-center justify-center rounded-full bg-alert-success-icon text-content-inverse">
                      <Check size={12} strokeWidth={3} aria-label="ได้" />
                    </span>
                  ) : (
                    <Minus size={14} className="text-content-disabled" aria-label="ไม่ได้" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
