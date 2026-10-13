// components/TemplatesPage/TemplatesPage.tsx
// "เทมเพลต" — start a new plan from a ready-made set of columns.
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlannerTopbar } from '@/components/PlannerShell';
import { usePlanNav } from '@/hooks/usePlanNav';
import { usePlannerScope } from '@/hooks/usePlannerScope';
import { PLAN_TEMPLATES } from '@/lib/shared/plan-templates';
import { TemplateCard } from './TemplateCard';

export function TemplatesPage() {
  const router = useRouter();
  const { planGroups, createPlan } = usePlanNav();
  const { scopeGroupId } = usePlannerScope();

  const handleUse = async (templateId: string, name: string, planGroupId: string | null) => {
    const created = await createPlan(name, planGroupId, templateId);
    if (!created) {
      toast.error('สร้างแผนงานไม่สำเร็จ — ชื่อนี้อาจถูกใช้แล้ว');
      return false;
    }
    toast.success(`สร้างแผนงาน "${name}" แล้ว`);
    router.push(`/plans/${(created as { id: string }).id}`);
    return true;
  };

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar showScope title="เทมเพลต" subtitle="เริ่มแผนงานใหม่จากโครงสร้างที่ใช้บ่อย" />

      <div className="grid items-start gap-3.5 px-5 pb-6 pt-1 md:grid-cols-2">
        {PLAN_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            planGroups={planGroups}
            defaultGroupId={scopeGroupId}
            onUse={(name, planGroupId) => handleUse(template.id, name, planGroupId)}
          />
        ))}
      </div>
    </div>
  );
}
