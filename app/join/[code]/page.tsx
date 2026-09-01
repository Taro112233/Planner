// app/join/[code]/page.tsx
// Landing page for an invite link. Redeems the code, switches the caller into
// the group's workspace, and drops them on the group — the same sequence the
// sidebar dialog runs, so a link and a typed code behave identically.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { PlanGroupJoinResultDto } from '@/types/planner';

export default function JoinByLinkRoute() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  // Strict mode mounts effects twice; joining twice is harmless but the extra
  // request is not.
  const startedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=/join/${params.code}`);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const join = async () => {
      try {
        const response = await fetch('/api/plan-groups/join', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: params.code }),
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error ?? 'เข้ากลุ่มไม่สำเร็จ');
        }

        const result = json.data as PlanGroupJoinResultDto;
        await fetch('/api/workspaces/active', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: result.organizationId }),
        });

        router.replace(`/groups/${result.planGroupId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เข้ากลุ่มไม่สำเร็จ');
      }
    };

    void join();
  }, [loading, user, params.code, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-5 py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-content-tertiary">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">กำลังเข้าร่วมกลุ่ม…</span>
    </div>
  );
}
